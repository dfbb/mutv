import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/034-waaaves';

registerRoot(registerVisualPreset(effect));
