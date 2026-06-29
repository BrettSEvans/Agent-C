import type { ProjectState, Stage, Checkpoint } from './schema'

const STAGE_ORDER: Stage[] = ['pm', 'ux', 'ui', 'architect', 'engineer', 'qa']

export class StateMachine {
  /**
   * Transition a stage from in-progress to awaiting-approval.
   * If pendingFeedback applies to this stage (revise mode), increment revisions and clear feedback.
   * Precondition: stage must be in-progress, and all earlier stages must be approved or skipped.
   */
  static complete(
    state: ProjectState,
    stage: Stage,
    artifactPath: string
  ): ProjectState {
    // Validate preconditions
    if (state.stages[stage].status !== 'in-progress') {
      throw new Error(`Stage ${stage} is not in-progress`)
    }

    // Check that all earlier stages are approved or skipped
    const stageIndex = STAGE_ORDER.indexOf(stage)
    for (let i = 0; i < stageIndex; i++) {
      const earlierStage = STAGE_ORDER[i]
      const status = state.stages[earlierStage].status
      if (status !== 'approved-complete' && status !== 'skipped') {
        throw new Error(`Earlier stage ${earlierStage} is not approved or skipped`)
      }
    }

    // Create new state with immutable update
    const newState = JSON.parse(JSON.stringify(state)) as ProjectState
    const stageInfo = newState.stages[stage]

    // Detect revise mode: if pendingFeedback.stage === stage, increment revisions and clear
    if (newState.pendingFeedback && newState.pendingFeedback.stage === stage) {
      stageInfo.revisions += 1
      newState.pendingFeedback = null
    }

    // Clear checkpoint and transition to awaiting-approval
    stageInfo.checkpoint = null
    stageInfo.status = 'awaiting-approval'

    // Update timestamp
    newState.updatedAt = new Date().toISOString()

    return newState
  }

  /**
   * Transition a stage from awaiting-approval to approved-complete.
   * Advances currentStage to the next stage (first not-started, not-skipped).
   * Precondition: stage must be awaiting-approval.
   */
  static approve(state: ProjectState, stage: Stage): ProjectState {
    // Validate precondition
    if (state.stages[stage].status !== 'awaiting-approval') {
      throw new Error(`Stage ${stage} is not awaiting-approval`)
    }

    // Create new state with immutable update
    const newState = JSON.parse(JSON.stringify(state)) as ProjectState
    newState.stages[stage].status = 'approved-complete'

    // Find the next stage to work on (first not-started that's not skipped)
    const stageIndex = STAGE_ORDER.indexOf(stage)
    for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
      const nextStage = STAGE_ORDER[i]
      const status = newState.stages[nextStage].status
      if (status !== 'approved-complete' && status !== 'skipped') {
        newState.currentStage = nextStage
        break
      }
    }

    // If all remaining stages are complete or skipped, stay at last stage
    if (newState.currentStage === stage) {
      newState.currentStage = STAGE_ORDER[STAGE_ORDER.length - 1]
    }

    // Update timestamp
    newState.updatedAt = new Date().toISOString()

    return newState
  }

  /**
   * Set pending feedback for a stage (typically from a critic or user).
   * This feedback will trigger revise mode on next complete().
   */
  static requestChanges(
    state: ProjectState,
    stage: Stage,
    feedbackText: string
  ): ProjectState {
    // Create new state with immutable update
    const newState = JSON.parse(JSON.stringify(state)) as ProjectState

    newState.pendingFeedback = {
      stage,
      source: 'user',
      text: feedbackText,
      reportPath: null
    }

    // Update timestamp
    newState.updatedAt = new Date().toISOString()

    return newState
  }

  /**
   * Skip a stage (mark as skipped and advance currentStage).
   * Precondition: stage must be not-started.
   */
  static skip(state: ProjectState, stage: Stage, reason: string): ProjectState {
    // Validate precondition
    if (state.stages[stage].status !== 'not-started') {
      throw new Error(`Stage ${stage} is not not-started`)
    }

    // Create new state with immutable update
    const newState = JSON.parse(JSON.stringify(state)) as ProjectState
    newState.stages[stage].status = 'skipped'

    // Advance currentStage to the next not-skipped stage
    const stageIndex = STAGE_ORDER.indexOf(stage)
    for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
      const nextStage = STAGE_ORDER[i]
      const status = newState.stages[nextStage].status
      if (status !== 'skipped') {
        newState.currentStage = nextStage
        break
      }
    }

    // Update timestamp
    newState.updatedAt = new Date().toISOString()

    return newState
  }

  /**
   * Save a checkpoint (progressive work state within a stage).
   * Checkpoints capture sectionsCompleted, currentSection, and notes.
   */
  static checkpoint(
    state: ProjectState,
    stage: Stage,
    checkpoint: Checkpoint
  ): ProjectState {
    // Create new state with immutable update
    const newState = JSON.parse(JSON.stringify(state)) as ProjectState
    newState.stages[stage].checkpoint = checkpoint

    // Update timestamp
    newState.updatedAt = new Date().toISOString()

    return newState
  }
}
