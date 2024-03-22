echo "test1"
diff <(python analyzeDir.py 5 ./test1 False) <(./analyzeDir 5 ./test1)
echo "test2"
diff <(python analyzeDir.py 5 ./test2 False) <(./analyzeDir 5 ./test2)
echo "test3"
diff <(python analyzeDir.py 5 ./test3 False) <(./analyzeDir 5 ./test3)
echo "test4"
diff <(python analyzeDir.py 5 ./test4 False) <(./analyzeDir 5 ./test4)
echo "test5"
diff <(python analyzeDir.py 5 ./test5 False) <(./analyzeDir 5 ./test5)
