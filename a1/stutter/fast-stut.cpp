#include <unistd.h>
#include <stdio.h>
#include <ctype.h>
#include <string>
#include <vector>

const size_t BUFFER_SIZE = 1024 * 1024; // 1MB buffer

// This code is (inspired) from fast-int.cpp by Pavol Federl (2020). 
unsigned char buffer[BUFFER_SIZE]; // Buffer for reading from stdin
int buff_size = 0; // Number of bytes currently in the buffer
int buff_pos = 0; // Current position in the buffer

// Function to read one character from the buffer
// Refills the buffer from STDIN when empty
int fast_read_one_character_from_stdin() {
    // Check if buffer needs to be refilled
    if (buff_pos >= buff_size) {
        buff_size = read(STDIN_FILENO, buffer, BUFFER_SIZE);
        if (buff_size <= 0)
            return -1; // Return -1 on EOF or error
        buff_pos = 0;
    }
    return buffer[buff_pos++];
}

// Function to read a line from STDIN using the buffer
// Returns a string up to and including the first newline character
std::string fast_readline() {
    std::string line;
    int ch;
    while ((ch = fast_read_one_character_from_stdin()) != -1) {
        line.push_back(ch);
        if (ch == '\n')
            break; // Stop reading if newline is encountered
    }
    return line;
}
//Citation ends here

// This code is from slow-stut.cpp by Jonathan Hudson (2024) CPSC 457
// Splits a string into a vector of words using whitespace as delimiter
std::vector<std::string> split(const std::string &p_line) {
    auto line = p_line + " "; // Adding a space to handle the last word
    bool in_str = false;
    std::string curr_word = "";
    std::vector<std::string> res;
    for (auto c : line) {
        if (isspace(c)) {
            if (in_str)
                res.push_back(curr_word); // Add word to result
            in_str = false;
            curr_word = "";
        } else {
            curr_word.push_back(c); // Build the current word
            in_str = true;
        }
    }
    return res;
}

// Returns true if a word is a stutter
// A stutter is defined as a string that reads the same twice in a row
// after converting all characters to lower case
bool is_stutter(const std::string &s) {
    if (s.size() % 2 != 0)
        return false; // Stutter must be even length
    for (size_t i = 0; i < s.size() / 2; i++) {
        if (tolower(s[i]) != tolower(s[i + s.size() / 2]))
            return false; // Check each character against its pair
    }
    return true;
}

// Returns the longest stutter found in standard input
// In case of ties for length, returns the first stutter found
std::string get_longest_stutter() {
    std::string max_stut;
    while (1) {
        std::string line = fast_readline();
        if (line.empty())
            break; // Stop processing on EOF
        auto words = split(line);
        for (auto &word : words) {
            if (word.size() <= max_stut.size())
                continue; // Skip if word is not longer than current max
            if (is_stutter(word))
                max_stut = word; // Update max stutter if a longer one is found
        }
    }
    return max_stut;
}
// Citation ends here
int main() {
    std::string max_stut = get_longest_stutter();
    printf("Longest stutter: %s\n", max_stut.c_str());
    return 0;
}
