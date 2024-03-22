.PHONY: all clean test

all:	slow-int fast-int

slow-int: slow-int.cpp
	g++ -O2 -Wall slow-int.cpp -o slow-int

fast-int: fast-int.cpp
	g++ -O2 -Wall fast-int.cpp -o fast-int

clean:
	-/bin/rm -f slow-int fast-int *.o *~

test:	slow-int fast-int
	-@echo ------------------------------------------------------
	-@echo Testing on 1KB
	python ./dup.py 1000 < t1.txt | time -p ./slow-int
	python ./dup.py 1000 < t1.txt | time -p ./fast-int
	-@echo ------------------------------------------------------
	-@echo Testing on 1MB
	python ./dup.py 1000000 < t1.txt | time -p ./slow-int
	python ./dup.py 1000000 < t1.txt | time -p ./fast-int
	-@echo ------------------------------------------------------
	-@echo Testing on 100MB
	python ./dup.py 100000000 < t1.txt | time -p ./slow-int
	python ./dup.py 100000000 < t1.txt | time -p ./fast-int




tmp:	slow-int-tmp fast-int-tmp

slow-int-tmp: slow-int.cpp
	g++ --save-temps -O2 -Wall slow-int.cpp -o slow-int

fast-int-tmp: fast-int.cpp
	g++ --save-temps -O2 -Wall fast-int.cpp -o fast-int

clean-tmp:
	-/bin/rm -f *.o *.ii *.s *~