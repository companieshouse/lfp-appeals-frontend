export class FileTransferError extends Error {}

export class UnsupportedFileTypeError extends FileTransferError {}

export class FileNotFoundError extends FileTransferError {}

export class FileNotReadyError extends FileTransferError {}
