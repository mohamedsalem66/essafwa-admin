'use client';
import { useState, useEffect, useRef } from "react";

const CategorySelect = ({
                            categories,
                            value,
                            onChange,
                            error,
                            onNewCategory,
                        }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Group categories by main category (text after last '-')
    const groupedCategories = categories.reduce((groups, category) => {
        const splitIndex = category.name.lastIndexOf('-');
        let mainCategory = "Other";
        let displayName = category.name;

        if (splitIndex !== -1) {
            mainCategory = category.name.substring(splitIndex + 1).trim();
            displayName = category.name.substring(0, splitIndex).trim();
        }

        if (!groups[mainCategory]) {
            groups[mainCategory] = [];
        }

        groups[mainCategory].push({
            ...category,
            displayName,
            mainCategory
        });

        return groups;
    }, {});

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Get selected category name for display
    const selectedCategory = categories.find(cat => cat.id === value);
    let displayValue = "Select a category";
    if (value === -1) {
        displayValue = "Custom Category";
    } else if (selectedCategory) {
        const splitIndex = selectedCategory.name.lastIndexOf('-');
        displayValue = splitIndex !== -1
            ? selectedCategory.name.substring(0, splitIndex).trim()
            : selectedCategory.name;
    }

    return (
        <div className="relative w-full" ref={wrapperRef} dir={'ltr'}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center p-3 rounded-lg border ${
                    error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left`}
            >
                <span className="truncate">{displayValue}</span>
                <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-lg shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto">
                    <div className="py-2">
                        {Object.entries(groupedCategories).map(([groupName, items]) => (
                            <div key={groupName} className="mb-2">
                                {/* Group header */}
                                <div className="px-3 py-2 text-m font-bold text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                                    {groupName}
                                </div>

                                {/* Category items */}
                                <div className="pl-4">
                                    {items.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(category.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-s ${
                                                value === category.id
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                                    : "text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                            }`}
                                        >
                                            {category.displayName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom category option */}
                        <div className="border-t border-gray-200 dark:border-gray-600">
                            <div className="px-3 py-2 text-m font-bold text-gray-900 dark:text-gray-300">
                                Other
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(-1);
                                    onNewCategory("");
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm ${
                                    value === -1
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                        : "text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                                }`}
                            >
                                Custom Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};

export default CategorySelect;
