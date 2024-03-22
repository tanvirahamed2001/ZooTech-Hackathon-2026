.PHONY: all clean

all:	slow-stut fast-stut

slow-stut: slow-stut.cpp
	g++ -O2 -Wall slow-stut.cpp -o slow-stut

fast-stut: fast-stut.cpp
	g++ -O2 -Wall fast-stut.cpp -o fast-stut

clean:
	-/bin/rm -f slow-stut fast-stut *.o *.ii *.s *~





tmp:	slow-stut-tmp fast-stut-tmp

slow-stut-tmp: slow-stut.cpp
	g++ --save-temps -O2 -Wall slow-stut.cpp -o slow-stut

fast-stut-tmp: fast-stut.cpp
	g++ --save-temps -O2 -Wall fast-stut.cpp -o fast-stut

clean-tmp:
	-/bin/rm -f *.o *.ii *.s *~

