package com.taans.zennercore.exception;

import org.springframework.security.core.AuthenticationException;

public class TokenReuseException extends AuthenticationException {

    public TokenReuseException(String message) {
        super(message);
    }
}
