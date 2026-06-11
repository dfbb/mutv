import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/045-stippling-on';

registerRoot(registerVisualPreset(effect));
