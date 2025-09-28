# B+ Tree Visualizer

Welcome to the B+ Tree Visualizer! This interactive web application is designed to help you understand the inner workings of a B+ Tree, a fundamental data structure used in databases and file systems.

You can perform operations like **inserting**, **finding**, and **deleting** keys and watch step-by-step animations that reveal how the tree maintains its balance and structure.

**NOTE** that the definition of the B+ Tree used here is (for order $M$):

1. The root is either a leaf or has between $2$ and $M$ children.
2. All nonleaf nodes (except the root) have between $\lceil \frac{M}{2} \rceil$ and $M$ children.
3. All leaves are at the same depth.
4. Assume each nonroot leaf also has between $\lceil \frac{M}{2} \rceil$ and $M$ keys.


## Features

- **Interactive Visualization**: See the B+ Tree structure change in real-time as you perform operations.
- **Step-by-Step Animations**: Each operation is broken down into a series of easy-to-follow steps, with clear explanations for each one.
- **Dynamic Rules Display**: The rules for the B+ Tree (node capacity, children count) automatically update based on the order you set.
- **Customizable Tree Order**: Set the order `M` of the tree to see how it affects the tree's shape and behavior.
- **Animation Speed Control**: Slow down the animations to carefully study complex operations like node splitting and merging, or speed them up to quickly build a large tree.
- **Clear Visual Cues**: Nodes are color-coded to indicate their state:
    - **Orange**: Internal Node
    - **Blue**: Leaf Node
    - **Yellow**: Currently being traversed or inspected.
    - **Red/Green**: Involved in a split or borrow operation.
    - **Purple**: Involved in a merge operation.

## How to Use the Visualizer

Follow these steps to get started with building and exploring your own B+ Tree.

### 1. Set the Tree Order (M)

Before you begin, you need to define the **order** of the tree. The order determines the maximum number of children an internal node can have and the maximum number of keys a leaf node can hold.

-   Enter a number between 3 and 10 in the **"Tree Order (M)"** input field.
-   Click the **"Set"** button.
-   The tree will reset, and the rules displayed on the left will update according to the new order.

### 2. Perform Operations

Use the **"Key"** input field to specify which value you want to work with.

-   **Insert**: To add a key to the tree, enter a number in the "Key" field and click **"Insert"**. The animation will show the path taken to find the correct leaf and what happens if a node becomes full (a "split").
-   **Find**: To search for a key, enter its value and click **"Find"**. The animation will highlight the traversal path from the root to the leaf where the key should be.
-   **Delete**: To remove a key, enter its value and click **"Delete"**. This will show the process of removing the key and how the tree handles an "underflow" condition by either **borrowing** from a sibling node or **merging** with one.

### 3. Control the Animation

-   Use the **"Animation Speed"** slider to adjust how long each step of the animation takes. Move it to the left for faster animations or to the right for slower, more detailed steps.
-   While an animation is playing, all controls will be disabled to ensure the operation completes without interruption.

### 4. Clear the Tree

-   Click the **"Clear Tree"** button at any time to start over with a fresh, empty tree of the currently set order.

## Acknowledgements

This visualizer was inspired by ZJU Advanced Data Structures course and built using React and Google AI Studio.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.