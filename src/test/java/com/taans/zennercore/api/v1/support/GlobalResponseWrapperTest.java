package com.taans.zennercore.api.v1.support;

import com.taans.zennercore.api.v1.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalResponseWrapperTest {

    private GlobalResponseWrapper wrapper;

    @BeforeEach
    void setUp() {
        wrapper = new GlobalResponseWrapper();
    }

    @Test
    @DisplayName("supports returns false for ApiResponse and ProblemDetail")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void supports_returnsFalseForApiResponseAndProblemDetail() {
        MethodParameter apiResponseParam = mock(MethodParameter.class);
        when(apiResponseParam.getParameterType()).thenReturn((Class) ApiResponse.class);
        assertThat(wrapper.supports(apiResponseParam, null)).isFalse();

        MethodParameter problemDetailParam = mock(MethodParameter.class);
        when(problemDetailParam.getParameterType()).thenReturn((Class) ProblemDetail.class);
        assertThat(wrapper.supports(problemDetailParam, null)).isFalse();
    }

    @Test
    @DisplayName("supports returns true for standard DTOs")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void supports_returnsTrueForStandardDto() {
        MethodParameter dtoParam = mock(MethodParameter.class);
        when(dtoParam.getParameterType()).thenReturn((Class) String.class);
        assertThat(wrapper.supports(dtoParam, null)).isTrue();
    }

    @Test
    @DisplayName("beforeBodyWrite wraps object into ApiResponse")
    void beforeBodyWrite_wrapsBodyIntoApiResponse() {
        MockHttpServletResponse mockResponse = new MockHttpServletResponse();
        mockResponse.setStatus(HttpStatus.OK.value());
        ServletServerHttpResponse serverResponse = new ServletServerHttpResponse(mockResponse);

        String sampleData = "test-payload";
        Object result = wrapper.beforeBodyWrite(
            sampleData,
            null,
            MediaType.APPLICATION_JSON,
            null,
            null,
            serverResponse
        );

        assertThat(result).isInstanceOf(ApiResponse.class);
        ApiResponse<?> apiResponse = (ApiResponse<?>) result;
        assertThat(apiResponse.success()).isTrue();
        assertThat(apiResponse.status()).isEqualTo(200);
        assertThat(apiResponse.message()).isEqualTo("Operation successful");
        assertThat(apiResponse.data()).isEqualTo(sampleData);
    }

    @Test
    @DisplayName("beforeBodyWrite does not wrap ProblemDetail")
    void beforeBodyWrite_doesNotWrapProblemDetail() {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        Object result = wrapper.beforeBodyWrite(
            problem,
            null,
            MediaType.APPLICATION_JSON,
            null,
            null,
            null
        );

        assertThat(result).isSameAs(problem);
    }
}
