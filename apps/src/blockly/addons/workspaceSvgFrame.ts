import {WorkspaceSvg} from 'blockly';
import type {Abstract} from 'blockly/core/events/events_abstract';
import {frameSizes} from './cdoConstants.js';
import SvgFrame from './svgFrame';
import {GoogleBlocklyWorkspace} from '../types.js';
const msg = require('@cdo/locale');

/**
 * Represents an SVG frame specifically designed for workspaces.
 * Created for the modal function editor, these frames fill the size of the
 * visible workspace, or surround the workspace content, whichever is greater.
 */
export default class WorkspaceSvgFrame extends SvgFrame {
  workspaceElement: WorkspaceSvg;
  /**
   * Constructs a WorkspaceSvgFrame instance for a workspace.
   * @param {Workspace} workspace - The workspace associated with the frame.
   * @param {string} text - The text to display in the frame.
   * @param {string} className - The CSS class name for styling.
   * @param {Function} getColor - Returns the color for the frame's header.
   */
  constructor(
    workspace: WorkspaceSvg,
    text: string,
    className: string,
    getColor: () => string
  ) {
    className = className || 'blocklyWorkspaceSvgFrame';
    text = text || msg.function();
    const fontSize = 16;
    super(
      workspace,
      text,
      className,
      getColor,
      frameSizes.WORKSPACE_HEADER_HEIGHT,
      fontSize
    );
    this.workspaceElement = workspace;
    const frameX = this.getFrameX();
    const frameY =
      frameSizes.MARGIN_TOP -
      this.workspaceElement.getMetricsManager().getMetrics().viewTop;
    super.initChildren(frameX, frameY);
    if (this.workspaceElement.RTL) {
      // Frame Text x coordinate is calculated differently for the workspace frame
      // than the default frame, so reset the x value here.
      this.frameText_?.setAttribute('x', `${this.getRtlFrameTextX()}`);
    }
    this.addBrowserResizeListener();
    this.workspaceElement.addChangeListener(onWorkspaceChange);
  }

  /**
   * Adds a browser resize listener to re-render the frame on resize.
   * Resizing the browser window also resizes the visible workspace area,
   * so we want to resize the frame as well.
   */
  addBrowserResizeListener() {
    window.addEventListener('resize', () => {
      // Frame size can depend upon workspace size, so we re-render.
      // Only resize if the element exists.
      if (this.frameGroup_) {
        this.render();
      }
    });
  }

  /**
   * Overrides the standard render to create a frame within the element, rather than around it.
   */
  render() {
    if (
      !this.frameText_ ||
      !this.frameClipRect_ ||
      !this.frameBase_ ||
      !this.frameHeader_
    ) {
      return;
    }
    const minWidth = this.frameText_.getBoundingClientRect().width;
    let width =
      Math.max(
        minWidth,
        this.workspaceElement.getMetricsManager().getMetrics().contentWidth
      ) +
      2 * frameSizes.MARGIN_SIDE;

    let height =
      this.workspaceElement.getMetricsManager().getMetrics().contentHeight +
      frameSizes.MARGIN_TOP +
      frameSizes.MARGIN_BOTTOM * 2 +
      frameSizes.WORKSPACE_HEADER_HEIGHT;
    // Increase the frame size to the full workspace.
    // Get the height and width of the rendered workspace, not including toolbox
    const viewMetrics = this.workspaceElement
      .getMetricsManager()
      .getViewMetrics();
    // Set the height and width based on the workspace size, unless the block content is bigger.
    width = Math.max(width, viewMetrics.width - frameSizes.MARGIN_SIDE);
    height = Math.max(
      height,
      viewMetrics.height - frameSizes.MARGIN_TOP - frameSizes.MARGIN_BOTTOM
    );
    super.render(width, height);

    const frameY =
      frameSizes.MARGIN_TOP -
      // Get top-edge of the visible portion of the workspace
      this.workspaceElement.getMetricsManager().getMetrics().viewTop;

    // Move the workspace frame up as the user scrolls down
    this.frameClipRect_.setAttribute('y', `${frameY}`);
    this.frameBase_.setAttribute('y', `${frameY}`);
    this.frameHeader_.setAttribute('y', `${frameY}`);
    this.frameText_?.setAttribute(
      'y',
      `${frameY + frameSizes.WORKSPACE_HEADER_HEIGHT / 2}`
    );
    if (this.workspaceElement.RTL) {
      const frameX = this.getFrameX();
      this.frameClipRect_.setAttribute('x', `${frameX}`);
      this.frameHeader_.setAttribute('x', `${frameX}`);
      this.frameBase_.setAttribute('x', `${frameX}`);
      this.frameText_.setAttribute('x', `${this.getRtlFrameTextX()}`);
    }
  }

  getFrameX() {
    // In LTR the svg should be to the right of the toolbox, plus a margin.
    let frameX =
      (this.workspaceElement.getToolbox()?.getWidth() || 0) +
      frameSizes.MARGIN_SIDE / 2;

    if (this.workspaceElement.RTL) {
      // In RTL the toolbox is on the right, so we don't need to leave space for
      // it. However, if the content is wider than the available space, we need to
      // move the x coordinate to the left so that content "extends" to the left
      // rather than the right.

      // Actual content width.
      const contentWidth =
        this.workspaceElement.getMetricsManager().getMetrics().contentWidth +
        2 * frameSizes.MARGIN_SIDE;
      // Width of the visible portion of the workspace.
      const viewWidth =
        this.workspaceElement.getMetricsManager().getViewMetrics().width -
        frameSizes.MARGIN_SIDE;
      // Offset to move the frame to the left.
      let offset = 0;
      if (contentWidth > viewWidth) {
        offset = contentWidth - viewWidth;
      }
      frameX = frameSizes.MARGIN_SIDE / 2 - offset;
    }
    return frameX;
  }

  getRtlFrameTextX() {
    // Width of the visible portion of the workspace.
    const viewWidth = this.workspaceElement
      .getMetricsManager()
      .getViewMetrics().width;
    // In RTL, frame text should be on the right side of the visible portion
    // of the screen, with a margin.
    return (
      viewWidth -
      (this.frameText_?.getBoundingClientRect().width || 0) -
      frameSizes.MARGIN_SIDE
    );
  }
}

/**
 * Event handler for changes in the workspace.
 *
 * This function is added as a change listener to the Blockly workspace. It triggers
 * when certain types of workspace events occur and re-renders the SVG frame
 * to re-center it on the content.
 *
 * @param {Blockly.Events.Abstract} event - The Blockly event object.
 */
function onWorkspaceChange(event: Abstract) {
  if (
    [
      Blockly.Events.DELETE,
      Blockly.Events.MOVE,
      Blockly.Events.THEME_CHANGE,
      Blockly.Events.VIEWPORT_CHANGE,
    ].includes(event.type)
  ) {
    if (!event.workspaceId) {
      return;
    }
    const workspace = Blockly.common.getWorkspaceById(event.workspaceId);
    if (!workspace) {
      return;
    }
    const svgFrame = (workspace as GoogleBlocklyWorkspace).svgFrame_;
    svgFrame.render();
  }
}
