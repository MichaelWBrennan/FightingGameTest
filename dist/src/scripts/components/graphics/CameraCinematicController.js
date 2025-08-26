import * as pc from 'playcanvas';
const CameraCinematicController = pc.createScript('cameraCinematicController');
// --- Attributes ---
CameraCinematicController.attributes.add('tiltAngle', {
    type: 'number',
    default: 8,
    title: 'Tilt Angle',
    description: 'The downward tilt of the camera in degrees for the 2.5D effect.',
});
CameraCinematicController.attributes.add('heightOffset', {
    type: 'number',
    default: 2,
    title: 'Height Offset',
});
CameraCinematicController.attributes.add('followSmoothing', {
    type: 'number',
    default: 0.1,
    title: 'Follow Smoothing',
    min: 0,
    max: 1,
});
CameraCinematicController.attributes.add('focusTarget', {
    type: 'entity',
    title: 'Focus Target',
    description: 'The entity that the camera should follow.',
});
// --- Lifecycle Methods ---
CameraCinematicController.prototype.initialize = function () {
    this.tiltMatrix = new pc.Mat4();
    this.followPosition = new pc.Vec3();
    this.targetPosition = new pc.Vec3();
    if (this.entity.camera) {
        this.entity.camera.projection = pc.PROJECTION_PERSPECTIVE;
        this.applyCameraTilt();
    }
    else {
        console.error('CameraCinematicController requires a Camera component on the entity.');
    }
};
CameraCinematicController.prototype.applyCameraTilt = function () {
    const tiltRadians = this.tiltAngle * pc.math.DEG_TO_RAD;
    this.tiltMatrix.setFromAxisAngle(pc.Vec3.RIGHT, tiltRadians);
    const currentRotation = this.entity.getRotation();
    const tiltRotation = new pc.Quat().setFromMat4(this.tiltMatrix);
    const finalRotation = new pc.Quat().mul2(currentRotation, tiltRotation);
    this.entity.setRotation(finalRotation);
};
CameraCinematicController.prototype.update = function (dt) {
    if (!this.focusTarget) {
        return;
    }
    // Smooth camera following
    const targetPos = this.focusTarget.getPosition();
    this.targetPosition.set(targetPos.x, targetPos.y + this.heightOffset, this.entity.getPosition().z // Keep the camera's z position
    );
    this.followPosition.lerp(this.entity.getPosition(), this.targetPosition, this.followSmoothing);
    this.entity.setPosition(this.followPosition);
};
export { CameraCinematicController };
//# sourceMappingURL=CameraCinematicController.js.map