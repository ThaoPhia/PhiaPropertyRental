'use client';

import { memo, useCallback, useMemo, useState } from 'react';


// Implement a feature to allow item selection with the following requirements:
// 1. Clicking an item selects/unselects it.
// 2. Multiple items can be selected at a time.
// 3. Make sure to avoid unnecessary re-renders of each list item in the big list (performance).
// 4. Currently selected items should be visually highlighted.
// 5. Currently selected items' names should be shown at the top of the page.
//
// Feel free to change the component structure at will.

type Item = {
  name: string;
  color: string;
};

type SelectedItem = Pick<Item, 'name' | 'color'>;

type ListItemProps = {
  item: Item;
  selected: boolean;
  onToggleItem: (item: Item) => void;
};

const ListItem = memo(function ListItem({ item, selected, onToggleItem }: ListItemProps) {
    return (
        <li className={selected ? 'List__row List__row--selected' : 'List__row'}>
            <button
                type="button"
                className={`List__item List__item--${item.color}`}
                onClick={() => onToggleItem(item)}
                aria-pressed={selected}
            >
                {item.name}
            </button>
        </li>
    );
});

type ListProps = {
    items: Item[];
    selectedNames: Set<string>;
    onToggleItem: (item: Item) => void;
};

const List = memo(function List({ items, selectedNames, onToggleItem }: ListProps) {
    return (
        <ul className="List">
            {items.map((item) => (
                <ListItem
                    key={item.name}
                    item={item}
                    selected={selectedNames.has(item.name)}
                    onToggleItem={onToggleItem}
                />
            ))}
        </ul>
    );
});

// ---------------------------------------
// Do NOT change anything below this line.
// ---------------------------------------

const sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
const colors = ['navy', 'blue', 'aqua', 'teal', 'olive', 'green', 'lime', 'yellow', 'orange', 'red', 'maroon', 'fuchsia', 'purple', 'silver', 'gray', 'black'];
const fruits = ['apple', 'banana', 'watermelon', 'orange', 'peach', 'tangerine', 'pear', 'kiwi', 'mango', 'pineapple'];

const items: Item[] = sizes.flatMap((size) =>
    fruits.flatMap((fruit) =>
        colors.map((color) => ({
            name: `${size} ${color} ${fruit}`,
            color,
        })),
    ),
);

export default function SelectableItemsPage() {
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    const handleToggleItem = useCallback((item: Item) => {
        setSelectedItems((current) => {
            const isSelected = current.some((selectedItem) => selectedItem.name === item.name);

            if (isSelected) {
                return current.filter((selectedItem) => selectedItem.name !== item.name);
            }

            return [...current, { name: item.name, color: item.color }];
        });
    }, []);

    const selectedNames = useMemo(() => {
        return new Set(selectedItems.map((item) => item.name));
    }, [selectedItems]);

    return (
        <main>
            <h1>Selectable Items</h1>
            <p>
                Selected:
                {' '}
                {selectedItems.length > 0
                    ? selectedItems.map((item) => item.name).join(', ')
                    : 'None'}
            </p>
            <List items={items} selectedNames={selectedNames} onToggleItem={handleToggleItem} />
        </main>
    );
}