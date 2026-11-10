package com.taans.zennercore.api.v1.support;

import com.taans.zennercore.api.v1.dto.response.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice(basePackages = "com.taans.zennercore.api")
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        Class<?> paramType = returnType.getParameterType();
        return !ApiResponse.class.isAssignableFrom(paramType) && !ProblemDetail.class.isAssignableFrom(paramType);
    }

    @Override
    public Object beforeBodyWrite(
        Object body,
        MethodParameter returnType,
        MediaType selectedContentType,
        Class<? extends HttpMessageConverter<?>> selectedConverterType,
        ServerHttpRequest request,
        ServerHttpResponse response
    ) {
        if (body instanceof ProblemDetail || body instanceof ApiResponse) {
            return body;
        }

        int statusCode = HttpStatus.OK.value();
        if (response instanceof ServletServerHttpResponse servletResponse) {
            statusCode = servletResponse.getServletResponse().getStatus();
        }

        return new ApiResponse<>(true, statusCode, "Operation successful", body);
    }
}
