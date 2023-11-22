import {BlockSvg} from 'blockly';
import {frameSizes} from './cdoConstants.js';
import SvgFrame from './svgFrame.js';

const msg = require('@cdo/locale');

/**
 * Represents an SVG frame specifically designed for blocks, rather than workspaces.
 */
export default class BlockSvgFrame extends SvgFrame {
  /**
   * Constructs an svg frame for a block, such as a function definition.
   * @param {Element} block - The block element associated with the frame.
   */
  constructor(
    block: BlockSvg,
    text: string,
    className: string,
    getColor: () => string
  ) {
    text = text || msg.block();
    className = className || 'blockFrame';
    super(block, text, className, getColor);

    const frameX = -frameSizes.MARGIN_SIDE;
    const frameY = -(frameSizes.MARGIN_TOP + frameSizes.BLOCK_HEADER_HEIGHT);
    super.initChildren(frameX, frameY);
  }
}
