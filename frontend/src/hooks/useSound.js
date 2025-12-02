import { useContext } from 'react';
import SoundContext from '../context/SoundContextInstance';

export const useSound = () => useContext(SoundContext);
