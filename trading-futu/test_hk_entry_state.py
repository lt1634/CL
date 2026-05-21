import importlib.util
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path


class DummyQuoteContext:
    def __init__(self, *args, **kwargs):
        self.closed = False

    def close(self):
        self.closed = True


def load_hk_entry_module():
    futu = types.ModuleType("futu")
    futu.RET_OK = 0
    futu.OpenQuoteContext = DummyQuoteContext
    sys.modules["futu"] = futu

    module_path = Path(__file__).with_name("hk_entry.py")
    spec = importlib.util.spec_from_file_location("hk_entry_under_test", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeLoc:
    def __getitem__(self, code):
        return {"last_price": 100.0, "prev_close_price": 100.0}


class FakeSnapshot:
    loc = FakeLoc()


class EntryStateTests(unittest.TestCase):
    def setUp(self):
        self.hk_entry = load_hk_entry_module()
        self.tmp = tempfile.TemporaryDirectory()
        self.state_file = Path(self.tmp.name) / "trade_state.json"
        self.hk_entry.STATE_FILE = str(self.state_file)
        self.hk_entry.quote_ctx = DummyQuoteContext()

    def tearDown(self):
        self.tmp.cleanup()

    def write_state(self, state):
        self.state_file.write_text(json.dumps(state), encoding="utf-8")

    def read_state(self):
        return json.loads(self.state_file.read_text(encoding="utf-8"))

    def test_no_signal_preserves_existing_state_file(self):
        existing = {"status": "CLOSED", "code": "HK.00700"}
        self.write_state(existing)
        self.hk_entry.get_snapshot = lambda codes: FakeSnapshot()
        self.hk_entry.enhanced_entry_signal = lambda code, hsi_change_pct: False

        self.hk_entry.run_entry_task()

        self.assertEqual(existing, self.read_state())

    def test_open_position_skips_market_scan_and_preserves_state(self):
        existing = {"status": "OPEN", "code": "HK.00700", "entry_price": 300.0, "qty": 100}
        self.write_state(existing)

        def fail_if_called(codes):
            raise AssertionError("market scan should be skipped when a position is already open")

        self.hk_entry.get_snapshot = fail_if_called

        self.hk_entry.run_entry_task()

        self.assertEqual(existing, self.read_state())
        self.assertTrue(self.hk_entry.quote_ctx.closed)

    def test_invalid_state_file_aborts_without_overwrite(self):
        self.state_file.write_text("{not-json", encoding="utf-8")
        self.hk_entry.get_snapshot = lambda codes: (_ for _ in ()).throw(
            AssertionError("market scan should be skipped when state is invalid")
        )

        self.hk_entry.run_entry_task()

        self.assertEqual("{not-json", self.state_file.read_text(encoding="utf-8"))
        self.assertTrue(self.hk_entry.quote_ctx.closed)


if __name__ == "__main__":
    unittest.main()
