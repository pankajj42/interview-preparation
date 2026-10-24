# Striver data fixes

The two Striver lists were transcribed verbatim into `scripts/source/` (diff them against your originals), then 23 reviewed fixes were applied by `scripts/build-striver.mjs`.
Each fix asserts the original value before changing it. "N/A" means no link, as in your lists.

| # | Where | What | Before | After |
|---|---|---|---|---|
| B1 | Bit Manipulation › #5 Single Number-I | GFG link was the sorted-array version, replaced by the XOR "number occurring odd number of times" article | https://www.geeksforgeeks.org/find-the-element-that-appears-once-in-sorted-array/ | https://www.geeksforgeeks.org/find-the-number-occurring-odd-number-of-times/ |
| B2 | Bit Manipulation › #8 XOR of Numbers in a Given Range | LeetCode link was a different problem (Find the XOR of Numbers Which Appear Twice); LeetCode has no range-XOR problem | https://leetcode.com/problems/find-the-xor-of-numbers-which-appear-twice/ | N/A |
| G1 | Graph › #24 Course Schedule I & II | Only part I was linked; split into two variants and added the LeetCode link for part II | LC https://leetcode.com/problems/course-schedule/ \| GFG https://www.geeksforgeeks.org/problems/course-schedule/1 | I: same links \| II: LC https://leetcode.com/problems/course-schedule-ii/ |
| G2 | Graph › #25 | Title named a different problem; both links already pointed to Alien Dictionary | Find First Non-Repeating Character (Alien Dictionary) | Alien Dictionary |
| G3 | Graph › #46 Kosaraju's Algorithm | LeetCode link was Maximum Number of Fish in a Grid (unrelated) | https://leetcode.com/problems/maximum-number-of-fish-in-a-grid/ | N/A |
| D1 | DP › #3 Frog Jump (DP-3) | GFG link was a 4-direction grid shortest-path article; replaced by GFG "Geek Jump" (the Frog Jump problem) | https://www.geeksforgeeks.org/minimum-cost-path-left-right-bottom-and-top-moves-allowed/ | https://www.geeksforgeeks.org/problems/geek-jump/1 |
| D2 | DP › #19 | Title had a stray "Assign Cookies /" prefix; links are Target Sum | Assign Cookies / Target Sum | Target Sum |
| D3 | DP › #21 | Title mixed two problems; links are Minimum Coins | Target Sum / Minimum Coins | Minimum Coins |
| D4 | DP › #35 Best Time to Buy and Sell Stock I, II, III, IV | Only III was linked; split into four variants with the LeetCode link for each part (GFG stays on III) | LC https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/ \| GFG https://www.geeksforgeeks.org/maximum-profit-by-buying-and-selling-a-share-at-most-twice/ | I, II, III, IV variants each with its own LeetCode link |
| D5 | DP › #47 Evaluate Boolean Expression to True | LeetCode link was Parsing a Boolean Expression (a different problem); LeetCode has no Boolean Parenthesization | https://leetcode.com/problems/parsing-a-boolean-expression/ | N/A |
| T1 | Trie › #2 Implement Trie II | LeetCode link was Trie I; replaced by Implement Trie II (Prefix Tree) | https://leetcode.com/problems/implement-trie-prefix-tree/ | https://leetcode.com/problems/implement-trie-ii-prefix-tree/ |
| S1 | DSA › 4. Number of Subarrays with Given XOR K | LeetCode link was Count the Number of Good Subarrays (unrelated to XOR) | https://leetcode.com/problems/count-the-number-of-good-subarrays/ | N/A |
| S2 | DSA › 7. Max Meetings in One Room | LeetCode link was Meeting Rooms II, which is the Minimum Platforms problem | https://leetcode.com/problems/meeting-rooms-ii/ | N/A |
| S3 | DSA › 7. Minimum Platforms Required | Primary LeetCode link should be Meeting Rooms II; Meeting Rooms III kept as the Variant link | https://leetcode.com/problems/meeting-rooms-iii/ | https://leetcode.com/problems/meeting-rooms-ii/ (+ Meeting Rooms III kept as Variant) |
| S4 | DSA › 11. Implement Stack › Using Array | LeetCode link was the queue-based stack problem | https://leetcode.com/problems/implement-stack-using-queues/ | N/A |
| S5 | DSA › 11. Implement Queue › Using Array | LeetCode link was the stack-based queue problem | https://leetcode.com/problems/implement-queue-using-stacks/ | N/A |
| S6 | DSA › 11. Sort a Stack Using Only Recursion | LeetCode link was Evaluate Reverse Polish Notation (unrelated) | https://leetcode.com/problems/evaluate-reverse-polish-notation/ | N/A |
| S7 | DSA › 13. Boundary Traversal | LeetCode link was Vertical Order Traversal; replaced by Boundary of Binary Tree | https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/ | https://leetcode.com/problems/boundary-of-binary-tree/ |
| S8 | DSA › 13. Children Sum Property | LeetCode link was Cousins in Binary Tree (unrelated) | https://leetcode.com/problems/cousins-in-binary-tree/ | N/A |
| S9 | DSA › 16. Strongly Connected Components | LeetCode link was Critical Connections (bridges), a different algorithm | https://leetcode.com/problems/critical-connections-in-a-network/ | N/A |
| S10 | DSA › 18. Count Distinct Substrings | LeetCode link was Distinct Subsequences; replaced by Number of Distinct Substrings in a String | https://leetcode.com/problems/distinct-subsequences/ | https://leetcode.com/problems/number-of-distinct-substrings-in-a-string/ |
| S11 | DSA › 18. Implement Trie › Trie I | GFG slug typo (…0657); the verified GFG page is …0651 | https://www.geeksforgeeks.org/problems/trie-insert-and-search0657/1 | https://www.geeksforgeeks.org/problems/trie-insert-and-search0651/1 |
| S12 | DSA › 18. Implement Trie › Trie II | LeetCode link was Trie I (now Implement Trie II); GFG link was Phone Directory, a different problem | LC https://leetcode.com/problems/implement-trie-prefix-tree/ \| GFG https://www.geeksforgeeks.org/problems/phone-directory4628/1 | LC https://leetcode.com/problems/implement-trie-ii-prefix-tree/ \| GFG N/A |

## Both links kept (sources disagreed, neither could be verified)

- Number of Islands II: both GFG slugs kept on both pages: https://www.geeksforgeeks.org/problems/number-of-islands-ii/1  and  https://www.geeksforgeeks.org/problems/number-of-islands-set-2/1
- Longest Word With All Prefixes / Longest Complete String: both GFG slugs kept on both pages: https://www.geeksforgeeks.org/problems/longest-string-in-dictionary--170647/1  and  https://www.geeksforgeeks.org/problems/longest-prefix-matching--170647/1

## Deliberately left as given

- Loose stand-ins: Max Sum Increasing Subsequence → Maximum Subarray; K-th Element of Two Sorted Arrays → K-th Smallest Prime Fraction; Kth Smallest → the BST problem.
- Links to a neighbouring problem: Root to Node Path → root-to-leaf versions; Nodes at Distance K → distance-from-root article; Coin Change GFG → count-ways article; Max XOR of Two Numbers GFG → max subarray XOR; Count and Say GFG → Decode the String; K-th Permutation GFG → all permutations.
- Label oddities: Subset Sum II GFG label; "Mirror of Itself or Not" links the tree-inversion problems; Pascal's "Element at (r, c)" carries the Nth-row links.
- "Premium" is not shown as a category (the links are ordinary links). Variants stay variants, with notes such as "Variant" shown beside their link.
