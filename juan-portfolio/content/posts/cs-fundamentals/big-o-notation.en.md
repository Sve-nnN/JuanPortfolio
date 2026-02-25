---
title: 'Big O Notation: Algorithmic Complexity Guide with Examples'
publishedAt: 2026-02-10
updatedAt: 2026-02-25
authors:
  - juan-carlos-angulo
heroImage: /images/blog/big-o-notation.webp
categoryTitle: CS Fundamentals
relatedPosts:
  - algorithmic-complexity
  - algorithms-data-structures
sidebarBanners: []
metaTitle: 'Big O Notation: Tutorial and Code Scalability Guide'
metaDescription: >-
  Learn to measure your code's efficiency. Complete guide on Big O Notation, time and space complexity with practical examples.
primary_keywords:
  - big o notation
  - time complexity
  - measure code efficiency
semantic_keywords:
  - algorithmic complexity
  - algorithm analysis
  - execution time
  - algorithm scalability
  - algorithm efficiency
  - asymptotic notation
uploaded: true
idioma: en
slug: big-o-notation-en
---
# Big O Notation: Understanding Algorithmic Complexity

**TL;DR (SGE Atomic Answer):** Big O notation is fundamental for understanding how an algorithm's time and memory scale with data size. This guide explores complexity types (constant, logarithmic, linear, quadratic, etc.) with practical Python examples. Learn to evaluate and optimize your code, understanding the factors that truly impact performance in real-world scenarios.

Big O notation is a key tool for analyzing algorithm efficiency. It allows classifying and comparing algorithms based on how their execution time or memory usage increases with input data size. This article will cover its fundamentals, types of complexities, and practical application. Different scenarios and examples will be explored to better understand algorithmic performance and the relevance of Big O notation in software development.

## Fundamentals of Big O Notation

Big O notation is based on several key concepts that allow classifying algorithms by their efficiency. This section describes each of these essential fundamentals for a proper understanding of how algorithms are analyzed in terms of their performance.

### Definition of Input Size Function

Input size functions are crucial in establishing how an algorithm behaves as the size of the data it processes increases. An algorithm takes a dataset as input, and its execution time or resource consumption is directly related to this input. Generally, it is represented by a variable 'n', which indicates the number of elements to process. This relationship helps predict how the algorithm will behave in practical scenarios.

### Concept of Growth Rate and Upper Bounds

The growth rate describes how the execution time or space used by an algorithm increases in relation to the growth of the input size. In this context, Big O notation represents an upper bound, which allows estimating maximum performance under adverse conditions. This is vital, as it offers developers a reliable guide on how an algorithm will scale against increasingly larger inputs.

-   O(1): Constant execution time, regardless of input size.
-   O(log n): Logarithmic increase, observed in structures that divide their input into smaller parts, such as in binary search.
-   O(n): Linear complexity, where execution time increases directly with input size.
-   O(n log n): Associates linear growth with a logarithmic operation, common in efficient [sorting algorithms](/blog/cs-fundamentals/sorting-algorithms).
-   O(n^2): Represents quadratic growth, typical of algorithms that process pairs of elements in matrices or lists.
-   O(2^n): Reflects exponential growth, normally associated with brute-force methods that explore all possible combinations.
-   O(n!): Represents factorial growth, this is one of the worst-case scenarios an algorithm can have.

### Difference Between Time and Space Complexity

Time complexity refers to the time an algorithm requires to complete its execution as input size changes. This parameter is essential for evaluating an algorithm's efficiency in terms of time. On the other hand, [space complexity](/blog/cs-fundamentals/algorithmic-complexity) evaluates the memory space an algorithm needs during its execution. Generally, an optimal design is expected not only to minimize the time required to process data but also the amount of memory used.

Understanding the difference between both concepts is fundamental for choosing the best algorithmic strategy when addressing specific problems. Algorithms that are time-efficient may not necessarily be space-efficient and vice versa. This duality in analysis allows developers to make informed decisions about which algorithms to implement based on the environment and available resources.

## Classification of Complexity in Algorithms

Classifying algorithm complexity is fundamental to understanding how an algorithm's performance varies with input size. Below are the most common types of [algorithmic complexity](/blog/cs-fundamentals/algorithms-data-structures) and their operation.

### Constant Complexity and Its Behavior in Simple Loops

Constant complexity refers to algorithms whose execution time does not depend on the input size. This means that no matter how much data is processed, the response time remains the same.

#### Examples of Element Access in Array

A classic example of constant complexity is accessing an element in an array. If you want to get the first element of a data list, the operation will take the same time regardless of how many elements the array contains. This type of implementation is efficient and fast, as there is no need to traverse the list.

```python
def get_first_element(arr):
    """
    Function with O(1) complexity to get the first element of an array.
    Execution time does not depend on array size.
    """
    if not arr:
        return None
    return arr[0]

# Usage examples:
my_list_small = [1, 2, 3]
my_list_large = [i for i in range(1000000)]

print(f"First element (small list): {get_first_element(my_list_small)}")
print(f"First element (large list): {get_first_element(my_list_large)}")
```
This example shows how the operation of accessing an element by its direct index in a list has O(1) complexity. It doesn't matter if the list has 3 elements or a million, the time to get the first element is always the same.

### Logarithmic Complexity and Its Application in Binary Search

Logarithmic complexity is common in algorithms that divide the input into smaller parts, as happens in binary search. This type of algorithm is very efficient as it halves the problem size at each step.

#### Operation and O(log n) Growth

The behavior of this type of complexity is such that, if an ordered dataset is available, the algorithm's execution time will increase slowly as the number of elements increases. The O(log n) function indicates this gradual growth, being ideal for long lists.

#### Practical Example of Searching in Ordered Data

In a binary search, the element being sought is compared with the middle element of the list. If it is smaller, the larger elements are discarded, and the process is repeated in the half containing the smaller values. This approach makes the algorithm significantly faster as data size grows.

```python
def binary_search(arr, target):
    """
    Function with O(log n) complexity to search for an element in a sorted array.
    """
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid  # Element found
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1  # Element not found

# Usage examples:
sorted_list = [1, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target1 = 23
target2 = 10

print(f"Searching for {target1} in {sorted_list}: Index {binary_search(sorted_list, target1)}")
print(f"Searching for {target2} in {sorted_list}: Index {binary_search(sorted_list, target2)}")
```
The `binary_search` example demonstrates how O(log n) complexity is achieved by halving the search space at each step. This makes it incredibly efficient for searching in large ordered datasets.

### Linear Complexity and Its Traversal in Input Elements

Linear complexity algorithms are those whose execution time increases directly in proportion to the input size. This means that if the number of data doubles, the required time will also double.

#### Loop Iteration and Proportional Execution Times

A typical example of linear complexity is a loop that iterates through all elements of a list to calculate their sum or find a specific element. In these cases, each element is processed only once, resulting in efficient and predictable execution.

```python
def sum_list_elements(arr):
    """
    Function with O(n) complexity to sum all elements of an array.
    Execution time grows linearly with array size.
    """
    total = 0
    for element in arr:
        total += element
    return total

# Usage examples:
my_list_small = [1, 2, 3, 4, 5]
my_list_large = [i for i in range(100000)]

print(f"Sum of small list: {sum_list_elements(my_list_small)}")
print(f"Sum of large list: {sum_list_elements(my_list_large)}")
```
This `sum_list_elements` example shows how an O(n) complexity algorithm processes each element once. The total time required increases directly in proportion to the number of elements in the list, making execution predictable and efficient for many use cases.

### Linear Logarithmic Complexity in Sorting Algorithms

Linear logarithmic complexity O(n log n) is present in algorithms that combine traversals and divisions. This type of complexity is common in efficient sorting algorithms.

#### Explanation of O(n log n) through Divisions and Combinations

Some sorting algorithms, such as Merge Sort, use a divide and conquer approach. Here, data is repeatedly divided into smaller lists until they are easily sortable. Then, these lists are combined. The result is an O(n log n) growth in execution time, which is much more efficient than other complexities like O(n^2).

```python
def merge_sort_nlogn(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        merge_sort_nlogn(L)
        merge_sort_nlogn(R)

        i = j = k = 0

        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1

        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1

# Usage example
data_nlogn = [12, 11, 13, 5, 6, 7]
print("Original array (O(n log n)):", data_nlogn)
merge_sort_nlogn(data_nlogn)
print("Sorted array (O(n log n)):", data_nlogn)
```
This `merge_sort_nlogn` example in Python demonstrates an O(n log n) complexity algorithm. By repeatedly dividing the problem and then combining the solutions, it achieves superior efficiency to quadratic algorithms, being ideal for sorting large volumes of data.

### Quadratic Complexity and Nested Loops

Quadratic complexity algorithms exhibit exponential behavior when processing lists or datasets whose relationships are compared with each other. This type of complexity is common in algorithms involving nested loops.

#### Example with Element Comparison in Arrays

A typical example would be an algorithm that compares all elements of an array with every other element. Execution time increases quadratically, meaning that if there is a list of n elements, execution time rises to O(n^2), making this type of algorithm less efficient for large lists.

```python
def print_all_pairs(arr):
    """
    Function with O(n^2) complexity to print all possible pairs of an array.
    Execution time grows quadratically with array size.
    """
    n = len(arr)
    for i in range(n):
        for j in range(n):
            print(f"({arr[i]}, {arr[j]})")

# Usage examples:
my_list_small = [1, 2, 3]
print("Pairs for small list:")
print_all_pairs(my_list_small)

# For a larger list, this would be significantly slower.
# print_all_pairs([i for i in range(1000)]) # Uncomment with caution!
```
This `print_all_pairs` example illustrates O(n^2) complexity using nested loops. Each element is compared with every other element, causing execution time to scale rapidly with input size, becoming inefficient for large datasets.

### Exponential and Factorial Complexities, Their Causes and Risks

Exponential and factorial complexities are observed in more complex problems and are generally less efficient due to their rapid growth. These complexities are usually discouraged in practice due to high computational requirements.

#### O(2^n) Growth and Combination Generation

O(2^n) complexity typically arises in algorithms that generate all possible combinations of a set. As elements are added to the input, execution time doubles, resulting in very poor large-scale performance.

```python
def fibonacci_exponential(n):
    """
    Function with O(2^n) complexity to calculate the n-th Fibonacci number.
    Execution time grows exponentially with 'n'.
    """
    if n <= 1:
        return n
    else:
        return fibonacci_exponential(n-1) + fibonacci_exponential(n-2)

# Usage examples (beware of high 'n' values!):
print(f"Fibonacci(5): {fibonacci_exponential(5)}")
print(f"Fibonacci(10): {fibonacci_exponential(10)}")
# print(f"Fibonacci(30): {fibonacci_exponential(30)}") # Uncomment with caution, it can take a long time
```
The recursive calculation of the Fibonacci number (`fibonacci_exponential`) is a clear example of O(2^n) complexity. Each function call generates two new calls, doubling the work with each increment of `n`. This demonstrates why exponential algorithms are impractical for medium or large inputs.

#### Factorial Complexity and Total Permutations

Factorial complexity, O(n!), is found in situations where all possible permutations of a list are sought. This means that at each step multiple combinations are generated, which causes execution time to grow extremely high, quickly becoming impractical for relatively short lists.

## 3. Practical Analysis with Examples and Solved Exercises

Practical algorithm analysis allows understanding how they behave in real-world scenarios. Illustrative examples and exercises will be shown to facilitate understanding of algorithmic complexity through concrete cases.

### Illustrative Examples of Algorithms with Different Growths

To understand how complexity manifests in different algorithms, examples are presented ranging from those with constant growth to those of exponential and factorial types. Each example will illustrate a specific use case and the impact on algorithm performance depending on input size.

#### Using Python Functions for Complexity Calculations

A practical approach in programming is to use languages like Python to implement examples that demonstrate how Big O notation applies to specific functions. For example, when defining a function that evaluates the sum of a list, execution time may vary depending on the complexity of the developed function:

-   Linear function: sums all elements of the list, using O(n).
-   Quadratic function: sums each element by comparing it with all other elements, falling into O(n^2).

By implementing these examples in Python, developers can directly observe the relationship between execution time and input size growth.

### Exercises for Calculating Big O Notation in Different Scenarios

Exercises are an excellent way to reinforce learning about algorithmic complexity and its practical impact. Through different scenarios, participants can practice calculating Big O notation.

#### Determine Complexity Based on Input Size

A common exercise is to analyze the complexity of algorithms that perform searches or traversals in a list. For example:

-   Calculate the complexity of a linear search within an array of length n, with O(n) performance.
-   Analyze the result of a binary search in a sorted array, whose execution time is O(log n).

In this way, understanding of how input size directly affects algorithm efficiency is promoted.

#### Exercises with Simple and Nested Loops

To deepen understanding of the notation, exercises can be proposed that include both simple and nested loops. Typical examples include:

-   Defining an algorithm that sums all elements in a list using a single loop, analyzing its O(n) complexity.
-   Creating an algorithm that compares all elements of an array with every other element, set at O(n^2).

These exercises can be evaluated in terms of execution time and required space, providing a practical and meaningful analysis of complexity.

### Case Studies: Code Evaluation and Optimization

Case studies allow exploring real implementations of algorithms and their evaluation. By examining specific examples, different ways to optimize code can be identified, considering its initial complexity and how it can be improved.

Examining the case of a sorting algorithm, such as Quicksort, which on average has O(n log n) complexity, allows discussing how it can be implemented more efficiently by choosing appropriate pivots. This exemplifies the importance of optimization in algorithmic design.

Reviewing code instances that exhibit high complexity, such as a brute-force algorithm for solving permutation problems, can be an great exercise to demonstrate how to improve efficiency and reduce execution time, going from O(n!) to O(n^2) using memoization strategies.

## Visualization and Comparison of Growth in Big O

Visualizing growth in Big O notation is fundamental to understanding how algorithms behave as input size increases. Through graphs and comparisons, efficiencies and deficiencies in different algorithms' performance can be quickly identified.

### Typical Graphs for Common Complexities

Graphs are effective tools for representing algorithm complexity. Below are some examples of what different curves look like according to Big O notation:

-   **O(1)**: Represents a horizontal line on the graph, indicating that execution time remains constant, regardless of the increase in input size.
-   **O(log n)**: This curve rises slowly, showing that the required time increases logarithmically, ideal for [search algorithms](/blog/cs-fundamentals/binary-trees) such as binary search.
-   **O(n)**: Presents as a diagonal line, indicating direct linear growth as input increases.
-   **O(n log n)**: Here, the curve initially grows slower than O(n^2) but more dynamically than O(n), becoming a popular choice for sorting algorithms.
-   **O(n^2)**: Shows an exponential increase, where the curve rises rapidly, especially for algorithms with nested loops.
-   **O(2^n)** and **O(n!)**: Both functions have extremely fast growth, with curves demonstrating unbridled scalability, making them impractical choices for large inputs.

### Interpretation of Logarithmic, Linear, and Polynomial Curves

Analyzing different curves is essential to understand how algorithms behave based on the size of input data. Logarithmic curves are ideal for systems that require almost optimal efficiency, while linear ones are suitable for everyday situations that do not demand exceptional performance. Polynomial curves, especially in the context of O(n^2), are less desirable due to their rapid scalability in terms of execution time.

### Impact of Exponential and Factorial Growth on Time and Space

Exponential and factorial complexities are particularly concerning in the field of algorithmic efficiency. The O(2^n) function denotes an execution time that doubles with each element added to the input, making these algorithms practically unfeasible for large datasets. Meanwhile, factorial complexity O(n!) represents a drastic increase in the time required as elements are added, affecting both time and memory space used. This understanding is crucial for selecting appropriate algorithms based on the specific context in which they will be applied.

## Factors Affecting Performance Beyond Big O Notation

Algorithm performance cannot only be measured through Big O notation. There are several elements that influence an algorithm's actual execution, and many of them can have a significant impact on speed and resource usage.

### Influence of Hardware and Operating System

The hardware and operating system configuration in which an algorithm runs play a fundamental role in its performance. Processor type, RAM amount, and system architecture are critical factors. A faster processor can execute operations in less time, while more RAM allows storing more data in memory, reducing disk access.

For example, algorithms that require intensive data operations can benefit considerably from optimized hardware. However, a system with hardware limitations can make even the most efficient algorithms behave slowly. Furthermore, the operating system is responsible for resource management and can introduce latencies not reflected in Big O notation.

### Relationship Between Input Data and Real Efficiency

Not all datasets have the same distribution or characteristics. Input data can vary significantly in its structure, affecting an algorithm's efficiency. For example, a sorting algorithm may have significantly different performance depending on whether data is already sorted, unsorted, or in a near-sorted state.

-   Search algorithms may perform better with sorted data, as is the case with binary search, which loses efficiency if unsorted data is used.
-   Similarly, some algorithms are designed to work efficiently with certain data patterns, and their performance can degrade if presented with inputs outside expectations.

### Differences Between Implementations and Practical Optimization

How an algorithm is implemented can drastically influence its performance. Different programming languages, libraries, and coding techniques can lead to significant variations in execution. The same algorithm can have different implementations with varying performance results, suggesting that practical optimization is essential.

A simpler implementation might be easier to understand but not always the most efficient. Developers often have to balance code readability with the need to improve performance. Optimization can include techniques such as reducing unnecessary operations, choosing more suitable data structures, or parallelizing processes.

-   Reusing previous results through memoization or caching can be crucial in certain contexts.
-   Implementing algorithms in a way that minimizes costly function calls or groups processing can improve performance.

### Practical Considerations and the Impact of Constant Factors

While Big O notation is an excellent theoretical tool for understanding scalability, in the real world, "constant factors" also play a role. An O(n) algorithm with a very high constant factor (due to poor implementation or a slow programming language) might be slower in practice for small to medium inputs than an O(n^2) algorithm with a very low constant factor.

This means that:
-   **Programming language and compiler/interpreter:** The same algorithm implemented in C++ (compiled, low-level language) will generally run faster than in Python (interpreted, high-level language), even if both have the same Big O complexity. This is because basic operations in C++ are usually faster.
-   **Hardware optimization:** Processor caches, RAM speed, and other hardware-level optimizations can make an algorithm behave better than theoretically expected, or worse if hardware is not ideal.
-   **Specific implementation:** Small details in how code is written (e.g., avoiding unnecessary object creation, efficiently using native data structures) can reduce constant factors and improve actual performance without changing Big O complexity.

Therefore, when choosing an algorithm, it is crucial to consider both its asymptotic complexity (Big O) and the constant factors relevant to the execution environment and the specific problem's requirements.

## Common Applications of Big O Notation in Algorithms

Big O notation is fundamental in algorithm analysis. Its applications are varied, especially in search and sorting algorithms, where efficiency is crucial.

### Usage in Popular Search and Sorting Algorithms

Search and sorting algorithms are essential in data management. Their performance can vary significantly depending on the associated Big O notation.

#### Binary Search Versus Linear Search

Binary search is a more efficient method than linear search. While linear search has an O(n) complexity, meaning that in the worst case it might require examining all elements of a list, binary search operates in O(log n), as this algorithm halves the number of elements with each comparison. This approach requires data to be pre-sorted, which is a factor to consider when choosing the method to implement.

#### Efficient Algorithms Based on O(n log n)

Many efficient sorting algorithms, such as Merge Sort and Heap Sort, have O(n log n) complexity. This type of growth is acceptable and often preferable for large datasets. Applying these algorithms allows optimizing execution time compared to simpler methods, such as Bubble Sort, which have O(n^2) complexity. Using an efficient algorithm can drastically reduce the time needed to process large volumes of data.

### Algorithm Evaluation as a Function of Data Size

Evaluating algorithms involves analyzing not only their complexity but also their effectiveness as a function of input size. Big O notation allows anticipating algorithm behavior as data volume increases. Weighing how a function behaves in relation to its inputs is key to determining which method to use.

### Considerations for Choosing Algorithms Based on Problem and Input

The choice of the correct algorithm depends on the problem context. Different scenarios require different approaches; for example, if frequent searches are needed in a static dataset, binary search might be the best option. In contrast, for constantly changing lists, the choice of a sorting algorithm may vary depending on its efficiency on average cases. Some considerations include:

-   Data size: Algorithms that are efficient on a small scale may not be appropriate for large volumes.
-   Data nature: Already sorted data can benefit from algorithms that assume this arrangement.
-   Available resources: Hardware or memory limitations can influence the choice of the most suitable algorithm.

Informed decisions in algorithm selection can significantly improve application performance and overall resource usage.