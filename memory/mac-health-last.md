# Mac 健康檢查

**時間**: 2026-05-18 08:20:09 +0800

## 1. 磁碟使用（根目錄）

```
Filesystem        Size    Used   Avail Capacity iused ifree %iused  Mounted on
/dev/disk3s1s1   228Gi    12Gi    53Gi    19%    459k  558M    0%   /
```

## 2. 家目錄（精簡 du：常見資料夾；略過整棵 Library）

```
9.5G	/Users/timnewmac/.hermes
7.7G	/Users/timnewmac/.openclaw
4.8G	/Users/timnewmac/.cache
4.0G	/Users/timnewmac/Desktop
3.8G	/Users/timnewmac/.npm
3.1G	/Users/timnewmac/.com.futunn.FutuOpenD
2.7G	/Users/timnewmac/Downloads
1.7G	/Users/timnewmac/.pm2
1.6G	/Users/timnewmac/Movies
1.0G	/Users/timnewmac/.local
885M	/Users/timnewmac/.venvs
278M	/Users/timnewmac/.bun
216M	/Users/timnewmac/.claude
209M	/Users/timnewmac/hermes-hudui
126M	/Users/timnewmac/Music
 94M	/Users/timnewmac/.cursor
 81M	/Users/timnewmac/.minimax-agent
 53M	/Users/timnewmac/MediaCrawler
 42M	/Users/timnewmac/bookmark-is-learned
 37M	/Users/timnewmac/.dropbox

（整棵 ~/Library 請用「系統設定 → 一般 → 儲存空間」；此處不 deep scan 以免逾時。）
```

## 3. 工作區 Desktop/CL（由大到小，最多 15 項）

```
3.8G	/Users/timnewmac/Desktop/CL/openclaw
 36M	/Users/timnewmac/Desktop/CL/projects
 28M	/Users/timnewmac/Desktop/CL/art-prompt-generator-v2
 25M	/Users/timnewmac/Desktop/CL/hegel-antithesis-soul
 19M	/Users/timnewmac/Desktop/CL/tools
3.0M	/Users/timnewmac/Desktop/CL/knowledge-work-plugins
852K	/Users/timnewmac/Desktop/CL/art-prompt-generator
744K	/Users/timnewmac/Desktop/CL/acip
504K	/Users/timnewmac/Desktop/CL/memory
216K	/Users/timnewmac/Desktop/CL/docs
 40K	/Users/timnewmac/Desktop/CL/templates
 20K	/Users/timnewmac/Desktop/CL/tests
 12K	/Users/timnewmac/Desktop/CL/scripts
 12K	/Users/timnewmac/Desktop/CL/schemas
8.0K	/Users/timnewmac/Desktop/CL/openclaw-cron.sh
```

## 4. 記憶體壓力（memory_pressure）

```
The system has 17179869184 (1048576 pages with a page size of 16384).

Stats: 
Pages free: 11961 
Pages purgeable: 1058 
Pages purged: 216965 

Swap I/O:
Swapins: 0 
Swapouts: 0 

Page Q counts:
Pages active: 282752 
Pages inactive: 267051 
Pages speculative: 14941 
Pages throttled: 0 
Pages wired down: 123956 

Compressor Stats:
Pages used by compressor: 308084 
Pages decompressed: 833069 
Pages compressed: 1712223 

File I/O:
Pageins: 2339379 
Pageouts: 18868 

System-wide memory free percentage: 57%
```

## 5. vm_stat（前 12 行）

```
Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                    12216.
Pages active:                                 282766.
Pages inactive:                               267123.
Pages speculative:                             14945.
Pages throttled:                                   0.
Pages wired down:                             123968.
Pages purgeable:                                1058.
"Translation faults":                      113228151.
Pages copy-on-write:                         2248106.
Pages zero filled:                          72739461.
Pages reactivated:                           1992381.
```

## 6. 熱相關（免 sudo：pmset）

```
Note: No thermal warning level has been recorded
Note: No performance warning level has been recorded
Note: No CPU power status has been recorded
```

## 7. CPU 快照（top 前 22 行）

```
Processes: 697 total, 2 running, 695 sleeping, 3756 threads 
2026/05/18 08:20:46
Load Avg: 4.94, 4.70, 5.91 
CPU usage: 26.63% user, 15.78% sys, 57.58% idle 
SharedLibs: 690M resident, 148M data, 132M linkedit.
MemRegions: 558824 total, 4626M resident, 234M private, 1317M shared.
PhysMem: 15G used (1938M wired, 4814M compressor), 438M unused.
VM: 330T vsize, 6144M framework vsize, 0(0) swapins, 0(0) swapouts.
Networks: packets: 119658/91M in, 56031/24M out.
Disks: 3748680/39G read, 267342/4872M written.

PID    COMMAND          %CPU TIME     #TH    #WQ #PORTS MEM   PURG  CMPRS PGRP  PPID  STATE    BOOSTS      %CPU_ME %CPU_OTHRS UID FAULTS  COW   MSGSENT  MSGRECV  SYSBSD   SYSMACH CSW      PAGEINS IDLEW POWER INSTRS CYCLES JETPRI USER                  #MREGS RPRVT VPRVT VSIZE KPRVT KSHRD
93841  mediaanalysisd-a 0.0  00:00.25 3      2   48     6768K 0B    6368K 93841 1     sleeping *0[5]       0.00000 0.00000    501 2877    103   240      125      8365     1349    652      9       0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
80867  contactsdonation 0.0  00:00.51 2      1   145    7824K 0B    1776K 80867 1     sleeping *0[2]       0.00000 0.00000    501 4589    155   1417     200      14743    2938    4824     29      0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
80849  intelligenceplat 0.0  00:00.16 2      1   65     7872K 0B    7408K 80849 1     sleeping  0[0]       0.00000 0.00000    501 1644    172   259      91       3468     752     519      70      0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
80782  mapssyncd        0.0  00:00.20 2      1   78     6880K 0B    3328K 80782 1     sleeping *0[5]       0.00000 0.00000    501 2045    121   497      225      8911     2220    1165     31      0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
78358  homeenergyd      0.0  00:00.30 2      1   102    10M   0B    9600K 78358 1     sleeping *0[5]       0.00000 0.00000    501 3239    284   661      303      11620    2822    1950     851     0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
75654  metrickitd       0.0  00:00.03 2      1   47     2336K 0B    2000K 75654 1     sleeping *0[1]       0.00000 0.00000    501 874     91    194      65       652      380     129      12      0     0.0   0      0      0      timnewmac             N/A    N/A   N/A   N/A   N/A   N/A  
75652  cfprefsd         0.0  00:00.03 2      1   28     2160K 0B    1872K 75652 1     sleeping *0[3]       0.00000 0.00000    277 866     90    151      64       722      297     110      2       0     0.0   0      0      0      _rmd                  N/A    N/A   N/A   N/A   N/A   N/A  
75462  seputil          0.0  00:00.01 2      1   31     1568K 0B    1328K 75462 1     sleeping  0[0]       0.00000 0.00000    0   565     87    131      61       360      255     120      7       0     0.0   0      0      0      root                  N/A    N/A   N/A   N/A   N/A   N/A  
75460  cfprefsd         0.0  00:00.03 2      1   27     2176K 0B    1904K 75460 1     sleeping *0[3]       0.00000 0.00000    260 845     90    151      64       717      297     151      3       0     0.0   0      0      0      _applepay             N/A    N/A   N/A   N/A   N/A   N/A  
75459  cfprefsd         0.0  00:00.03 2      1   23     2128K 0B    1856K 75459 1     sleeping *0[9]       0.00000 0.00000    274 839     89    155      70       783      298     152      3       0     0.0   0      0      0      _installcoordinationd N/A    N/A   N/A   N/A   N/A   N/A  
```

---

*只讀快照；未使用 sudo。可選：手動跑 `sudo powermetrics --samplers thermal -n 1 -i 1000` 取得更細熱資料（勿放進無人值守 cron）。*
*本次報告耗時約 37 秒。*
