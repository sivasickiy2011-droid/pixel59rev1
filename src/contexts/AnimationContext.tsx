import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnimationContextType {
  animationEnabled: boolean;
  toggleAnimation: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const [animationEnabled, setAnimationEnabled] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem('animation_enabled');
    if (savedPreference === 'true') {
      setAnimationEnabled(true);
    }
  }, []);

  const toggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    localStorage.setItem('animation_enabled', String(newValue));
    
    if (newValue) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
  };

  useEffect(() => {
    if (!animationEnabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [animationEnabled]);

  return (
    <AnimationContext.Provider value={{ animationEnabled, toggleAnimation }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
