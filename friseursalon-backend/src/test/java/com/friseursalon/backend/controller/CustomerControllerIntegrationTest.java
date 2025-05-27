package com.friseursalon.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.friseursalon.backend.model.User;
import com.friseursalon.backend.payload.request.ProfileUpdateRequest;
import com.friseursalon.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // Ensure tests are rolled back
public class CustomerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll(); // Clean up before each test
        testUser = new User();
        testUser.setEmail("testuser@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setPhoneNumber("1234567890");
        userRepository.save(testUser);
    }

    @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_Success() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName("UpdatedFirstName");
        updateRequest.setLastName("UpdatedLastName");
        updateRequest.setPhoneNumber("0987654321");

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("UpdatedFirstName"))
                .andExpect(jsonPath("$.lastName").value("UpdatedLastName"))
                .andExpect(jsonPath("$.phoneNumber").value("0987654321"))
                .andExpect(jsonPath("$.email").value(testUser.getEmail())); // Email should not change

        User updatedDbUser = userRepository.findByEmail(testUser.getEmail()).orElseThrow();
        assertThat(updatedDbUser.getFirstName()).isEqualTo("UpdatedFirstName");
        assertThat(updatedDbUser.getLastName()).isEqualTo("UpdatedLastName");
        assertThat(updatedDbUser.getPhoneNumber()).isEqualTo("0987654321");
        assertThat(updatedDbUser.getEmail()).isEqualTo(testUser.getEmail());
    }

    @Test
    @WithMockUser(username = "nonexistentuser@example.com", roles = "USER")
    void testUpdateUserProfile_UserNotFound() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName("FirstName");
        updateRequest.setLastName("LastName");

        // Note: The controller uses @AuthenticationPrincipal UserDetails currentUser.
        // Spring's UserDetailsService (which backs @WithMockUser by default if not customized further)
        // will throw UsernameNotFoundException if it can't find "nonexistentuser@example.com".
        // This typically results in a 401 Unauthorized or redirect to login, not a 404 from the controller logic itself,
        // unless the UserDetailsService is configured to return null or some special handling.
        // However, our CustomerService.updateUserProfile explicitly throws UsernameNotFoundException
        // if the user (identified by email from UserDetails) isn't found by userRepository.findByEmail.
        // So, if @WithMockUser successfully creates a UserDetails object for "nonexistentuser@example.com"
        // (e.g. because UserDetailsService is lenient or it's a mock that just provides the username),
        // then our service logic's "User not found" will be hit.

        // Let's assume UserDetailsService loads the user for @WithMockUser, but our service method
        // `updateUserProfile` is called with "nonexistentuser@example.com", and `userRepository.findByEmail`
        // for this email returns empty. This is what we want to test for the service-level 404.
        // To ensure this, we must make sure "nonexistentuser@example.com" is NOT in the DB.
        // setUp() already cleans the repository and only adds "testuser@example.com".

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound()); // Expecting 404 due to UsernameNotFoundException in CustomerService
    }

    @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_InvalidInput_FirstNameTooLong() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        // Assuming @Size(max=50) for firstName as per ProfileUpdateRequest.java
        updateRequest.setFirstName("ThisNameIsDefinitelyWayTooLongAndShouldExceedTheFiftyCharacterLimit");
        updateRequest.setLastName("ValidLastName");

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_InvalidInput_LastNameTooLong() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName("ValidFirstName");
        // Assuming @Size(max=50) for lastName
        updateRequest.setLastName("ThisNameIsDefinitelyWayTooLongAndShouldExceedTheFiftyCharacterLimitForLastName");

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_InvalidInput_PhoneNumberTooLong() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName("ValidFirstName");
        updateRequest.setLastName("ValidLastName");
        // Assuming @Size(max=15) for phoneNumber
        updateRequest.setPhoneNumber("12345678901234567890"); // Exceeds 15 chars

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_Success_OnlyFirstName() throws Exception {
        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName("NewFirstOnly");

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("NewFirstOnly"))
                .andExpect(jsonPath("$.lastName").value(testUser.getLastName())) // Should remain unchanged
                .andExpect(jsonPath("$.phoneNumber").value(testUser.getPhoneNumber())); // Should remain unchanged

        User updatedDbUser = userRepository.findByEmail(testUser.getEmail()).orElseThrow();
        assertThat(updatedDbUser.getFirstName()).isEqualTo("NewFirstOnly");
        assertThat(updatedDbUser.getLastName()).isEqualTo(testUser.getLastName());
        assertThat(updatedDbUser.getPhoneNumber()).isEqualTo(testUser.getPhoneNumber());
    }

     @Test
    @WithMockUser(username = "testuser@example.com", roles = "USER")
    void testUpdateUserProfile_Success_ClearPhoneNumber() throws Exception {
        // First, ensure the user has a phone number
        testUser.setPhoneNumber("111222333");
        userRepository.save(testUser);

        ProfileUpdateRequest updateRequest = new ProfileUpdateRequest();
        updateRequest.setFirstName(testUser.getFirstName()); // Keep same
        updateRequest.setLastName(testUser.getLastName());   // Keep same
        updateRequest.setPhoneNumber(""); // Attempt to clear phone number

        mockMvc.perform(put("/api/customers/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value(testUser.getFirstName()))
                .andExpect(jsonPath("$.lastName").value(testUser.getLastName()))
                .andExpect(jsonPath("$.phoneNumber").value(""));

        User updatedDbUser = userRepository.findByEmail(testUser.getEmail()).orElseThrow();
        assertThat(updatedDbUser.getPhoneNumber()).isEqualTo("");
    }
}
