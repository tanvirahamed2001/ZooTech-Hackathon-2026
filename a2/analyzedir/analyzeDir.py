#!/bin/env python3

# Copyright (C) 2024 Jonathan Hudson (jwhudson@ucalgary.ca)
# All Rights Reserved. Do not distribute this file.

import os, subprocess, collections, shlex, sys, time

def get_pic_size(pth):
    try:
        res = subprocess.run(
            ["identify", "-format", "%w %h", shlex.quote(pth)],
            text=True,
            capture_output=True,
        )
        if res.returncode != 0:
            return -1, -1
        w, h = (int(n) for n in res.stdout.split())
        if w == 0 or h == 0:
            return -1, -1
        return w, h
    except:
        return -1, -1


class DirAnalyzer:
    def __init__(self, n, dir, printer):
        os.chdir(dir)
        self.printer = printer
        self.progress_last_report = time.time() - 100
        self.progress_nfiles_total = 0
        self.progress_nfiles_current = 0
        for root, dirs, files in os.walk("."):
            self.progress_nfiles_total += len(files)
            if(printer):
                print(f"\rPre-counting files... {self.progress_nfiles_total}", end="")
        if printer:
            print()
        self._progress()
        self.largest_file = ""
        self.largest_file_size = -1
        self.total_file_size = 0
        self.ndirs = 0
        self.whist = collections.defaultdict(int)
        self.pics = []
        self.nfiles, self.empties, self.ldirs = self._process()
        self._progress(force=True)
        self.ldirs.sort(key=lambda e: (-e[1], e[0]))
        self.ldirs = self.ldirs[:n]
        self.whist = [(-e[1], e[0]) for e in self.whist.items()]
        self.whist = sorted(self.whist)
        self.whist = self.whist[:n]
        self.empties.sort()
        self.pics.sort(key=lambda e: (-max(e[1][0] , e[1][1]), -e[1][0], -e[1][1], e[0]))
        self.pics = self.pics[:n]
        self._report()

    def _progress(self, force=False):
        WIDTH = 50
        ct = time.time()
        if ct - self.progress_last_report < 1.0 and not force:
            return
        self.progress_last_report = ct
        if self.progress_nfiles_total > 0:
            p = self.progress_nfiles_current / self.progress_nfiles_total
            p = min(p, 1)
        else:
            p = 1
        if self.printer:
            print(f"\rAnalyzing: ", end="")
            ndone = int(p * WIDTH)
            nrem = WIDTH - ndone
            print("#" * ndone, "." * nrem, sep="", end="")
            print(f" ({100*p:5.2f}%) ", end="")
            print(flush=True, end="")

    def _update_whist(self, fname: str):
        if not fname.lower().endswith(".txt"):
            return
        with open(fname, "rb") as fp:
            mm = fp.read()
            if len(mm) == 0:
                return
            wl = 0
            for i in range(len(mm)):
                c = mm[i]
                # capitalize
                if c >= 65 and c <= 90:
                    c += 32
                if c < 97 or c > 122:
                    # on non-alpha char update histogram and reset word
                    if wl > 5:
                        word = mm[i - wl : i].decode(encoding="ascii").lower()
                        self.whist[word] += 1
                    wl = 0
                else:
                    wl += 1
            # record last word
            if wl > 5:
                i = len(mm)
                word = mm[i - wl : i].decode(encoding="ascii").lower()
                self.whist[word] += 1
                wl = 0

    def _process(self, dir=None):
        self._progress()
        self.ndirs += 1
        nfiles = 0
        empties = []
        local_size = 0
        dsize = []
        for entry in os.listdir(dir):
            self._progress()
            entry_path = f"{dir}/{entry}" if dir else entry
            if os.path.isfile(entry_path):
                nfiles += 1
                self.progress_nfiles_current += 1
                s = os.path.getsize(entry_path)
                local_size += s
                self.total_file_size += s
                if s > self.largest_file_size:
                    self.largest_file_size = s
                    self.largest_file = entry_path
                self._update_whist(entry_path)
                ps = get_pic_size(entry_path)
                if ps[0] >= 0:
                    self.pics.append((entry_path, ps))
            elif os.path.isdir(entry_path):
                sub_nfiles, sub_empties, sub_dsize = self._process(entry_path)
                nfiles += sub_nfiles
                empties.extend(sub_empties)
                dsize.extend(sub_dsize)
        if dir == ".":
            pass
        if local_size != 0:
            if dir == None:
                dsize.append((".", local_size))
            else:
                dsize.append((dir, local_size))
        if nfiles == 0:
            if dir is None:
                return 0, ["."], dsize
            else:
                return 0, [dir], dsize
        else:
            return nfiles, empties, dsize

    def _report(self):
        if self.printer :
            print()
        print("--------------------------------------------------------------")
        print(f'Largest file:      "{self.largest_file}"')
        print(f"Largest file size: {self.largest_file_size}")
        print(f"Number of files:   {self.nfiles}")
        print(f"Number of dirs:    {self.ndirs}")
        print(f"Total file size:   {self.total_file_size}")
        print("Largest directories:")
        for d in self.ldirs:
            print(f' - "{d[0]}" x {d[1]:d}')
        print("Most common words from .txt files:")
        for w in self.whist:
            print(f' - "{w[1]}" x {-w[0]:d}')
        print("Vacant directories:")
        for d in self.empties:
            print(f' - "{d}"')
        print("Largest images:")
        for p in self.pics:
            print(f' - "{p[0]}" {p[1][0]}x{p[1][1]}')
        print("--------------------------------------------------------------")


def main(argv):
    try:
        n = int(argv[1])
        if len(argv) == 4 and argv[3] == "False":
            printer = False
        else:
            printer = True
    except:
        print(f"Usage: {argv[0]} N directory_name")
        sys.exit(-1)
    DirAnalyzer(n, sys.argv[2], printer )


if __name__ == "__main__":
    main(sys.argv)