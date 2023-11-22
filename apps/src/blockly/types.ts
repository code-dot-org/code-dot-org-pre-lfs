import {Workspace} from 'blockly';
import {AnyDuringMigration} from '../util/types';
import SvgFrame from './addons/svgFrame';

// TODO: Make a better version of this type
export type BlocklyWrapper = AnyDuringMigration;

export type GoogleBlocklyWorkspace = Workspace & {
  noFunctionBlockFrame?: boolean;
  svgFrame_?: SvgFrame;
};
