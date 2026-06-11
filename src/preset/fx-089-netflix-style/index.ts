import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/089-netflix-style';

registerRoot(registerVisualPreset(effect));
