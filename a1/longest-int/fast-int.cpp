/*
 * This is free and unencumbered software released into the public domain.
 *
 * This program reads in text from stdin and reports the longest
 * integer string encountered (consecutive sequence of digits).
 *
 * This is a more effiction version of slow-int.cpp, because it minimizes
 * the number of read() system call by buffering its results.
 *
 * Written by Pavol Federl (2020)
 */

#include <unistd.h>
#include <stdio.h>
#include <ctype.h>
#include <string>

// we'll use global variables to track of characters that we
// read() into memory
unsigned char buffer[1024 * 1024]; // 1MB sotrage to hold results of read()
int buff_size = 0;                 // stores how many characters are stored in buffer
int buff_pos = 0;                  // position in bufffer[] where we extract next char

// returns the next byte from stdin, or -1 on EOF
// returns characters stored in buffer[] until it is empty
// when buffer[] gets empty, it is replenished by calling read()
int fast_read_one_character_from_stdin()
{
  // check if buffer[] is empty
  if (buff_pos >= buff_size)
  {
    // buffer is empty, let's replenish it
    buff_size = read(STDIN_FILENO, buffer, sizeof(buffer));
    // detect EOF
    if (buff_size <= 0)
      return -1;
    // reset position from where we'll return characters
    buff_pos = 0;
  }
  // return the next character from the buffer and update position
  return buffer[buff_pos++];
}

// returns the next consecutive sequence of digit characters
// from standard input
std::string
stdin_read_digits()
{
  std::string result;
  while (true)
  {
    int c = fast_read_one_character_from_stdin();
    if (c == -1)
      break;
    if (!isdigit(c))
    {
      if (result.size() > 0)
        break;
    }
    else
    {
      result.push_back(c);
    }
  }
  return result;
}

// returns the longest integer encountered on standard input
// in case of ties, returns the first such longest integer
std::string
get_longest_int()
{
  std::string max_int;
  while (1)
  {
    std::string word = stdin_read_digits();
    if (word.size() == 0)
      break;
    if (word.size() <= max_int.size())
      continue;
    max_int = word;
  }
  return max_int;
}

int main()
{
  std::string max_int = get_longest_int();
  printf("Longest integer: %s\n", max_int.c_str());
  return 0;
}

