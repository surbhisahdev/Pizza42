// Mocked menu data. Orders are NOT stored in Auth0 (see requirement #7).
export const CATEGORIES = ['All', 'Pizzas', 'Sides', 'Drinks', 'Desserts'];

export const MENU = [
  { id: 1, category: 'Pizzas', emoji: '🍕', name: 'Margherita', desc: 'San Marzano tomato, fresh mozzarella, basil.', price: 12.0 },
  { id: 2, category: 'Pizzas', emoji: '🌶️', name: 'Pepperoni Inferno', desc: 'Double pepperoni, hot honey, chili flakes.', price: 15.5 },
  { id: 3, category: 'Pizzas', emoji: '🍄', name: 'Truffle Mushroom', desc: 'Roasted mushrooms, truffle oil, fontina.', price: 16.0 },
  { id: 4, category: 'Pizzas', emoji: '🥬', name: 'Garden Veggie', desc: 'Peppers, olives, onion, spinach, feta.', price: 13.5 },
  { id: 5, category: 'Sides', emoji: '🥖', name: 'Garlic Knots', desc: 'Six knots with garlic butter and parmesan.', price: 6.0 },
  { id: 6, category: 'Sides', emoji: '🥗', name: 'Caesar Salad', desc: 'Romaine, croutons, parmesan, house dressing.', price: 8.0 },
  { id: 7, category: 'Drinks', emoji: '🥤', name: 'Craft Soda', desc: 'Orange cream, root beer, or lemon-lime.', price: 3.5 },
  { id: 8, category: 'Desserts', emoji: '🍮', name: 'Tiramisu', desc: 'Espresso-soaked ladyfingers, mascarpone.', price: 7.5 },
];

export const SIZES = [
  { id: 'S', label: 'Small 10"', extra: -2 },
  { id: 'M', label: 'Medium 12"', extra: 0 },
  { id: 'L', label: 'Large 14"', extra: 3 },
];

export const TOPPINGS = [
  { id: 'mozzarella', label: 'Mozzarella', emoji: '🧀', price: 1.5 },
  { id: 'pepperoni', label: 'Pepperoni', emoji: '🍖', price: 2 },
  { id: 'mushrooms', label: 'Mushrooms', emoji: '🍄', price: 1.5 },
  { id: 'onions', label: 'Onions', emoji: '🧅', price: 1 },
  { id: 'peppers', label: 'Bell peppers', emoji: '🫑', price: 1 },
  { id: 'olives', label: 'Olives', emoji: '🫒', price: 1 },
  { id: 'basil', label: 'Fresh basil', emoji: '🌿', price: 0.75 },
  { id: 'jalapenos', label: 'Jalapeños', emoji: '🌶️', price: 1 },
  { id: 'pineapple', label: 'Pineapple', emoji: '🍍', price: 1.25 },
  { id: 'bacon', label: 'Bacon', emoji: '🥓', price: 2 },
];

// Toppings each pizza ships with (shown pre-checked, can be removed)
export const DEFAULT_TOPPINGS = {
  1: ['mozzarella', 'basil'],
  2: ['mozzarella', 'pepperoni', 'jalapenos'],
  3: ['mozzarella', 'mushrooms'],
  4: ['mozzarella', 'peppers', 'olives', 'onions'],
};
