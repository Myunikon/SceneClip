
export class DownloadError extends Error {
    constructor(message: string, public code: string = 'DOWNLOAD_ERROR', public recoverable: boolean = true) {
        super(message)
        this.name = 'DownloadError'
    }
}

export class BinaryMissingError extends Error {
    constructor(binaryName: string) {
        super(`${binaryName} is missing or not found.`)
        this.name = 'BinaryMissingError'
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NetworkError'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthenticationError'
    }
}
