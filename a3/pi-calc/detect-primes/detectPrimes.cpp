#include <iostream>
#include <vector>
#include <thread>
#include <mutex>
#include <cmath>
#include <atomic>

std::vector<int64_t> nums; // Shared input vector
std::vector<int64_t> result; // Shared result vector
std::atomic<int> index(0); // Atomic index to keep track of the next number to process
std::mutex result_mutex; // Mutex to protect access to the result vector

bool is_prime(int64_t n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int64_t i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

void process_primes() {
    while (true) {
        int current_index = index.fetch_add(1);
        if (current_index >= nums.size()) break;

        int64_t current_num = nums[current_index];
        if (is_prime(current_num)) {
            std::lock_guard<std::mutex> guard(result_mutex);
            result.push_back(current_num);
        }
    }
}

std::vector<int64_t> detect_primes(const std::vector<int64_t>& input_nums, int n_threads) {
    nums = input_nums; // Initialize the shared input vector
    std::vector<std::thread> threads;

    // Launch threads
    for (int i = 0; i < n_threads; ++i) {
        threads.emplace_back(process_primes);
    }

    // Join threads
    for (auto& t : threads) {
        t.join();
    }

    return result;
}
