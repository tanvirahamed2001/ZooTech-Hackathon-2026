/*
 * This is free and unencumbered software released into the public domain.
 *
 * This program reads in text from stdin and reports the longest
 * integer string encountered (consecutive sequence of digits).
 *
 * This is a very inefficient program because it calls the read() system
 * call for every single character.
 *
 * Written by Pavol Federl (2020)
 */

#include <unistd.h>
#include <stdio.h>
#include <ctype.h>
#include <string>

// returns the next consecutive sequence of digit characters
// from standard input
std::string
stdin_read_digits()
{
  unsigned char buffer;
  std::string result;
  while (1 == read(STDIN_FILENO, &buffer, 1))
  {
    if (!isdigit(buffer))
    {
      if (result.size() > 0)
        break;
    }
    else
    {
      result.push_back(buffer);
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
