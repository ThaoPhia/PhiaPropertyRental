'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, memo, useCallback, useEffect, useState } from 'react';

import { useAdminSession } from '@/hooks/useAdminSession';

type Item = {
    name: string;
    color: string;
};

const sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
const colors = ['navy', 'blue', 'aqua', 'teal', 'olive', 'green', 'lime', 'yellow', 'orange', 'red', 'maroon', 'fuchsia', 'purple', 'silver', 'gray', 'black'];
const fruits = ['apple', 'banana', 'watermelon', 'orange', 'peach', 'tangerine', 'pear', 'kiwi', 'mango', 'pineapple'];

const items = sizes.reduce<Item[]>((items, size) => {
    return [
        ...items,
        ...fruits.reduce<Item[]>((acc, fruit) => {
            return [
                ...acc,
                ...colors.reduce<Item[]>((acc, color) => {
                    return [
                        ...acc,
                        {
                            name: `${size} ${color} ${fruit}`,
                            color,
                        },
                    ];
                }, []),
            ];
        }, []),
    ];
}, []);

type SelectedItem = {
    name: string;
    color: string;
};

type ListProps = {
    items: Item[];
    selectedItems: readonly SelectedItem[];
    onToggleItem: (item: Item) => void;
};

type SelectedItemsProps = {
    selectedItems: readonly SelectedItem[];
};

type ListItemProps = {
    item: Item;
    selected: boolean;
    onToggleItem: (item: Item) => void;
};

const colorValues: Record<string, string> = {
    navy: '#001f3f',
    blue: '#0074d9',
    aqua: '#7fdbff',
    teal: '#39cccc',
    olive: '#3d9970',
    green: '#2ecc40',
    lime: '#01ff70',
    yellow: '#ffdc00',
    orange: '#ff851b',
    red: '#ff4136',
    maroon: '#85144b',
    fuchsia: '#f012be',
    purple: '#b10dc9',
    black: '#111111',
    gray: '#aaaaaa',
    silver: '#dddddd',
};

function SelectedItems({ selectedItems }: SelectedItemsProps) {
    return (
        <div className="SelectedItems">
            <p className="SelectedItems__title">Selected items</p>
            {selectedItems.length === 0 ? (
                <p className="SelectedItems__empty">Nothing selected yet.</p>
            ) : (
                <div className="SelectedItems__list">
                    {selectedItems.map(({ name, color }) => {
                        const backgroundColor = colorValues[color] ?? color;
                        const textColor = ['aqua', 'teal', 'lime', 'yellow', 'silver', 'gray'].includes(color) ? '#111827' : 'white';

                        return (
                            <span
                                key={name}
                                className="SelectedItems__chip"
                                style={{ backgroundColor, color: textColor }}
                            >
                                {name}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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

const List = memo(function List({ items, selectedItems, onToggleItem }: ListProps) {
    return (
        <Fragment>
            <ul className="List">
                {items.map((item) => (
                    <ListItem
                        key={item.name}
                        item={item}
                        selected={selectedItems.some((selectedItem) => selectedItem.name === item.name)}
                        onToggleItem={onToggleItem}
                    />
                ))}
            </ul>
            <style jsx global>{`
                .List {
                    margin: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    grid-auto-rows: 60px;
                    grid-gap: 16px;
                }

                .List__row {
                    list-style: none;
                }

                .List__item {
                    width: 100%;
                    height: 100%;
                    border: 0;
                    border-radius: 8px;
                    line-height: 60px;
                    text-align: center;
                    color: white;
                    cursor: pointer;
                    text-shadow: 1px 1px rgba(0, 0, 0, 0.5);
                    box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.05);
                    transition: transform 120ms ease, box-shadow 120ms ease, outline-color 120ms ease;
                    padding: 0 10px;
                    font: inherit;
                }

                .List__item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0px 6px 18px rgba(0, 0, 0, 0.12);
                }

                .List__item:focus-visible {
                    outline: 3px solid rgba(59, 130, 246, 0.85);
                    outline-offset: 2px;
                }

                .List__row--selected .List__item {
                    outline: 3px solid rgba(17, 24, 39, 0.7);
                    outline-offset: -3px;
                    box-shadow:
                        inset 0 0 0 9999px rgba(255, 255, 255, 0.35),
                        0px 8px 20px rgba(0, 0, 0, 0.18);
                }

                .SelectedItems {
                    margin: 0 16px 16px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.04);
                }

                .SelectedItems__title {
                    margin: 0 0 8px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #6b7280;
                }

                .SelectedItems__empty {
                    color: #9ca3af;
                    font-size: 14px;
                }

                .SelectedItems__list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .SelectedItems__chip {
                    max-width: 100%;
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: #111827;
                    color: white;
                    font-size: 13px;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Taken from https://clrs.cc/ */

                .List__item--navy {
                    background-color: #001f3f;
                }

                .List__item--blue {
                    background-color: #0074d9;
                }

                .List__item--aqua {
                    background-color: #7fdbff;
                }

                .List__item--teal {
                    background-color: #39cccc;
                }

                .List__item--olive {
                    background-color: #3d9970;
                }

                .List__item--green {
                    background-color: #2ecc40;
                }

                .List__item--lime {
                    background-color: #01ff70;
                }

                .List__item--yellow {
                    background-color: #ffdc00;
                }

                .List__item--orange {
                    background-color: #ff851b;
                }

                .List__item--red {
                    background-color: #ff4136;
                }

                .List__item--maroon {
                    background-color: #85144b;
                }

                .List__item--fuchsia {
                    background-color: #f012be;
                }

                .List__item--purple {
                    background-color: #b10dc9;
                }

                .List__item--black {
                    background-color: #111111;
                }

                .List__item--gray {
                    background-color: #aaaaaa;
                }

                .List__item--silver {
                    background-color: #dddddd;
                }
            `}</style>
        </Fragment>
    );
});

export default function CMSSelectableTestPage() {
    const router = useRouter();
    const { admin, isLoading: isAuthLoading } = useAdminSession();
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() => []);

    const handleToggleItem = useCallback((item: Item) => {
        setSelectedItems((current) => {
            const isSelected = current.some((selectedItem) => selectedItem.name === item.name);

            if (isSelected) {
                return current.filter((selectedItem) => selectedItem.name !== item.name);
            }

            return [...current, { name: item.name, color: item.color }];
        });
    }, []);

    useEffect(() => {
        if (!isAuthLoading && admin === null) {
            router.push('/cms/login');
        }
    }, [admin, isAuthLoading, router]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
                <div className="mb-4">
                    <Link href="/cms" className="text-sm text-gray-500 hover:text-gray-700">
                        &larr; Back to CMS
                    </Link>
                    {' '}|{' '}
                    <Link href="/cms/playground" className="text-sm text-gray-500 hover:text-gray-700">
                        &larr; Back to Playground
                    </Link>
                </div>
                <SelectedItems selectedItems={selectedItems} />
                <div>
                    <List items={items} selectedItems={selectedItems} onToggleItem={handleToggleItem} />
                </div>
            </div>
        </div>
    );
}