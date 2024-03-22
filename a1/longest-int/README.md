# longest-int-my-getchar

There are two C++ programs in this repo. Both programs read in text
from stdin and report the longest integer string encountered
(consecutive sequence of digit characters).

The implementation in [slow-int.cpp](slow-int.cpp) is very inefficient
because it calls the read() system call for every single character.

The second program, [fast-int.cpp](fast-int.cpp), is a more effiction version,
because it minimizes the number of read() system call by
buffering its results.
