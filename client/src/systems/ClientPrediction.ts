// ─── Client Prediction System ───
// Buffers input snapshots for client-side prediction and server reconciliation.
// When the server acknowledges an input sequence, we can discard old inputs
// and replay any unacknowledged inputs to correct drift.

import * as THREE from 'three';

// ─── Types ───

export interface InputSnapshot {
  sequence: number;
  dt: number;
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
  yaw: number;
  pitch: number;
}

export interface PredictedState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  sequence: number;
}

// ─── Client Prediction ───

export class ClientPrediction {
  private pendingInputs: InputSnapshot[] = [];
  private sequence = 0;
  private lastAcknowledgedSequence = -1;

  // Maximum pending inputs before we start dropping old ones
  private readonly maxPendingInputs = 120; // ~2 seconds at 60fps

  // ─── Input Recording ───

  /**
   * Record an input snapshot and return its sequence number.
   */
  recordInput(input: Omit<InputSnapshot, 'sequence'>): InputSnapshot {
    this.sequence++;
    const snapshot: InputSnapshot = {
      ...input,
      sequence: this.sequence,
    };

    this.pendingInputs.push(snapshot);

    // Prevent unbounded growth
    if (this.pendingInputs.length > this.maxPendingInputs) {
      this.pendingInputs.shift();
    }

    return snapshot;
  }

  // ─── Server Reconciliation ───

  /**
   * Called when the server acknowledges up to a certain sequence number
   * and provides the authoritative position.
   * Returns the list of unacknowledged inputs that need to be replayed.
   */
  reconcile(
    serverSequence: number,
    _serverPosition: THREE.Vector3,
  ): InputSnapshot[] {
    if (serverSequence <= this.lastAcknowledgedSequence) {
      return [];
    }

    this.lastAcknowledgedSequence = serverSequence;

    // Remove all acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      (input) => input.sequence > serverSequence,
    );

    // Return remaining unacknowledged inputs for replay
    return [...this.pendingInputs];
  }

  // ─── Queries ───

  getSequence(): number {
    return this.sequence;
  }

  getPendingCount(): number {
    return this.pendingInputs.length;
  }

  getLastAcknowledgedSequence(): number {
    return this.lastAcknowledgedSequence;
  }

  /**
   * Get all pending (unacknowledged) inputs.
   */
  getPendingInputs(): readonly InputSnapshot[] {
    return this.pendingInputs;
  }

  // ─── Reset ───

  reset(): void {
    this.pendingInputs = [];
    this.sequence = 0;
    this.lastAcknowledgedSequence = -1;
  }
}