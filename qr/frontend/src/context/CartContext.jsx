import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Table ID from URL parameter or saved storage
  const [tableId, setTableId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTable = params.get('table') || params.get('t');
    if (urlTable) {
      const formatted = urlTable.toLowerCase().startsWith('table') ? urlTable : `Table ${urlTable}`;
      localStorage.setItem('zaika_table_id', formatted);
      return formatted;
    }
    return localStorage.getItem('zaika_table_id') || 'Table 1';
  });

  // Cart items
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('zaika_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer session info
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('zaika_customer');
      return saved ? JSON.parse(saved) : { name: '', phone: '', otpToken: '' };
    } catch {
      return { name: '', phone: '', otpToken: '' };
    }
  });

  // General cooking / delivery instructions
  const [generalInstructions, setGeneralInstructions] = useState(() => {
    return localStorage.getItem('zaika_instructions') || '';
  });

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('zaika_cart', JSON.stringify(cart));
  }, [cart]);

  // Save customer info
  useEffect(() => {
    localStorage.setItem('zaika_customer', JSON.stringify(customer));
  }, [customer]);

  // Save instructions
  useEffect(() => {
    localStorage.setItem('zaika_instructions', generalInstructions);
  }, [generalInstructions]);

  // Sync table if URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTable = params.get('table') || params.get('t');
    if (urlTable) {
      const formatted = urlTable.toLowerCase().startsWith('table') ? urlTable : `Table ${urlTable}`;
      setTableId(formatted);
      localStorage.setItem('zaika_table_id', formatted);
    }
  }, []);

  // Seamlessly sync cart items when backend menu changes (price updates, availability toggles)
  // while preserving user quantities and notes!
  const syncWithLatestMenu = useCallback((latestItems) => {
    if (!latestItems || latestItems.length === 0) return;
    const itemMap = new Map(latestItems.map((i) => [i.id, i]));

    setCart((prevCart) => {
      let changed = false;
      const updated = prevCart.map((cartItem) => {
        const freshItem = itemMap.get(cartItem.item.id);
        if (freshItem) {
          // Check if price, availability, or name changed
          if (
            freshItem.price !== cartItem.item.price ||
            freshItem.available !== cartItem.item.available ||
            freshItem.name !== cartItem.item.name
          ) {
            changed = true;
            return {
              ...cartItem,
              item: { ...freshItem },
            };
          }
        }
        return cartItem;
      });

      return changed ? updated : prevCart;
    });
  }, []);

  const addToCart = (item, qty = 1, note = '') => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, qty: i.qty + qty, note: note || i.note } : i
        );
      }
      return [...prev, { item, qty, note }];
    });
  };

  const updateQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const setItemNote = (itemId, note) => {
    setCart((prev) =>
      prev.map((i) => (i.item.id === itemId ? { ...i, note } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('zaika_cart');
  };

  const updateCustomerInfo = (info) => {
    setCustomer((prev) => ({ ...prev, ...info }));
  };

  // Financial calculations
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + (Number(i.item.price) || 0) * i.qty, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        setItemNote,
        clearCart,
        syncWithLatestMenu,
        tableId,
        setTableId: (t) => {
          setTableId(t);
          localStorage.setItem('zaika_table_id', t);
        },
        customer,
        updateCustomerInfo,
        generalInstructions,
        setGeneralInstructions,
        totalItemCount,
        subtotal,
        tax,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
