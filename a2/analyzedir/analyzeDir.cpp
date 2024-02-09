#include "analyzeDir.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <unordered_map>
#include <map>
#include <algorithm>
#include <filesystem>
#include <set>
#include <regex>

namespace fs = std::filesystem;

// Helper function to process text files and update word counts
void processTextFile(const fs::path& filePath, std::unordered_map<std::string, int>& wordCounts) {
    std::ifstream file(filePath);
    std::string word;
    while (file >> word) {
        // Increment word count for each word
        ++wordCounts[word];
    }
}

// Function to analyze a directory and return results
Results analyzeDir(int n) {
    Results results{};
    std::unordered_map<std::string, int> wordCounts;
    std::set<std::string> visitedDirectories;
    std::map<std::string, long> directorySizes;

    // Ensure the current (root) directory is counted
    visitedDirectories.insert(fs::current_path().string());

    for (const auto& entry : fs::recursive_directory_iterator(fs::current_path(), fs::directory_options::skip_permission_denied)) {
        const auto& path = entry.path();
        std::string parentPath = path.parent_path().string();
        if (entry.is_directory()) {
            visitedDirectories.insert(path.string());
        } else {
            ++results.n_files;
            auto fileSize = fs::file_size(path);
            results.all_files_size += fileSize;

            if (fileSize > results.largest_file_size) {
                results.largest_file_size = fileSize;
                results.largest_file_path = path.filename().string(); // Store only the filename
            }

            if (path.extension() == ".txt") {
                processTextFile(path, wordCounts);
            }

            // Accumulate file sizes for each directory
            directorySizes[parentPath] += fileSize;
        }
    }

    // Count directories including the root
    results.n_dirs = visitedDirectories.size();

    // Sort and resize wordCounts to keep top N words
    std::vector<std::pair<std::string, int>> sortedWords(wordCounts.begin(), wordCounts.end());
    std::sort(sortedWords.begin(), sortedWords.end(), [](const auto& a, const auto& b) {
        return a.second > b.second || (a.second == b.second && a.first < b.first);
    });
    if (sortedWords.size() > static_cast<size_t>(n)) {
        sortedWords.resize(n);
    }
    results.most_common_words = sortedWords;

    // Find up to N largest directories
    std::vector<std::pair<std::string, long>> sortedDirs(directorySizes.begin(), directorySizes.end());
    std::sort(sortedDirs.begin(), sortedDirs.end(), [](const auto& a, const auto& b) {
        return a.second > b.second || (a.second == b.second && a.first < b.first);
    });
    if (sortedDirs.size() > static_cast<size_t>(n)) {
        sortedDirs.resize(n);
    }

    // Convert to required format for largest directories
    for (const auto& dir : sortedDirs) {
        if (dir.second > 0) { // Include only non-empty directories
            results.largest_dirs.push_back({dir.first, dir.second});
        }
    }

    // Further processing for vacant directories and largest images as per requirements

    return results;
}
