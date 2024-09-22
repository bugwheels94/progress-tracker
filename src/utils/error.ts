export function ErrorWithStatus(
	this: Error & { status: number },
	message: string | null,
	status: any,
	err?: Error
) {
	const error = err === undefined ? Error.call(this, message || "") : err;
	this.name = error === err ? "RunTimeError" : "UserGeneratedError";
	this.message = message || "";
	this.stack = error.stack;
	this.status = status;
}

ErrorWithStatus.prototype = Object.create(Error.prototype);
ErrorWithStatus.prototype.constructor = ErrorWithStatus;
