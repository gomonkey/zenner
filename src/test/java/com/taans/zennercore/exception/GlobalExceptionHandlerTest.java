package com.taans.zennercore.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleResourceNotFoundException maps to 404 ProblemDetail")
    void handleResourceNotFoundException_returns404ProblemDetail() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Resource not found");
        ProblemDetail problem = exceptionHandler.handleResourceNotFoundException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problem.getTitle()).isEqualTo("Resource Not Found");
        assertThat(problem.getDetail()).isEqualTo("Resource not found");
        assertThat(problem.getType()).isEqualTo(URI.create("/errors/not-found"));
        assertThat(problem.getProperties()).containsEntry("success", false);
    }

    @Test
    @DisplayName("handleIllegalArgumentException maps to 400 ProblemDetail")
    void handleIllegalArgumentException_returns400ProblemDetail() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid argument passed");
        ProblemDetail problem = exceptionHandler.handleIllegalArgumentException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getTitle()).isEqualTo("Invalid Argument");
        assertThat(problem.getDetail()).isEqualTo("Invalid argument passed");
        assertThat(problem.getType()).isEqualTo(URI.create("/errors/invalid-argument"));
        assertThat(problem.getProperties()).containsEntry("success", false);
    }

    @Test
    @DisplayName("handleMethodArgumentTypeMismatch maps to 400 ProblemDetail")
    void handleMethodArgumentTypeMismatch_returns400ProblemDetail() {
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex =
            new org.springframework.web.method.annotation.MethodArgumentTypeMismatchException(
                "invalid-uuid",
                java.util.UUID.class,
                "dayId",
                null,
                new IllegalArgumentException("Invalid UUID string")
            );

        ProblemDetail problem = exceptionHandler.handleMethodArgumentTypeMismatch(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getTitle()).isEqualTo("Bad Request");
        assertThat(problem.getDetail()).contains("dayId").contains("invalid-uuid");
        assertThat(problem.getType()).isEqualTo(URI.create("/errors/type-mismatch"));
        assertThat(problem.getProperties()).containsEntry("success", false);
    }

    @Test
    @DisplayName("handleValidationException maps to 400 ProblemDetail with field errors")
    @SuppressWarnings("unchecked")
    void handleValidationException_returns400WithErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
            new FieldError("objectName", "title", "must not be blank")
        ));

        ProblemDetail problem = exceptionHandler.handleValidationException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getTitle()).isEqualTo("Bad Request");
        assertThat(problem.getType()).isEqualTo(URI.create("/errors/validation-failed"));
        assertThat(problem.getProperties()).containsKey("errors");
        Map<String, String> errors = (Map<String, String>) problem.getProperties().get("errors");
        assertThat(errors).containsEntry("title", "must not be blank");
        assertThat(problem.getProperties()).containsEntry("success", false);
    }

    @Test
    @DisplayName("handleGenericException maps to 500 ProblemDetail with generic detail")
    void handleGenericException_returns500ProblemDetail() {
        Exception ex = new RuntimeException("Sensitive database stacktrace");
        ProblemDetail problem = exceptionHandler.handleGenericException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getTitle()).isEqualTo("Internal Server Error");
        assertThat(problem.getDetail()).isEqualTo("An unexpected error occurred");
        assertThat(problem.getType()).isEqualTo(URI.create("/errors/internal-error"));
        assertThat(problem.getProperties()).containsEntry("success", false);
    }
}
