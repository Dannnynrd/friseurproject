package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.model.User;
import com.friseursalon.backend.payload.request.ProfileUpdateRequest;
import com.friseursalon.backend.repository.CustomerRepository;
import com.friseursalon.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Für Transaktionen

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository; // Added UserRepository

    @Autowired
    public CustomerService(CustomerRepository customerRepository, UserRepository userRepository) { // Updated constructor
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    @Transactional // Sicherstellen, dass die Operation atomar ist
    public Customer createCustomer(Customer customer) {
        // Hier könnten Validierungen oder zusätzliche Logik stehen, bevor gespeichert wird
        return customerRepository.save(customer);
    }

    @Transactional
    public User updateUserProfile(String email, ProfileUpdateRequest profileUpdateRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Update fields if they are provided in the request
        if (profileUpdateRequest.getFirstName() != null) {
            user.setFirstName(profileUpdateRequest.getFirstName());
        }
        if (profileUpdateRequest.getLastName() != null) {
            user.setLastName(profileUpdateRequest.getLastName());
        }
        if (profileUpdateRequest.getPhoneNumber() != null) {
            user.setPhoneNumber(profileUpdateRequest.getPhoneNumber());
        }

        return userRepository.save(user);
    }

    @Transactional
    public Customer findOrCreateCustomer(Customer customerDetails) {
        Optional<Customer> existingCustomer = customerRepository.findByEmail(customerDetails.getEmail());
        if (existingCustomer.isPresent()) {
            Customer customerToUpdate = existingCustomer.get();
            // Nur aktualisieren, wenn neue Werte vorhanden sind und sich von alten unterscheiden (optional)
            if (customerDetails.getFirstName() != null && !customerDetails.getFirstName().equals(customerToUpdate.getFirstName())) {
                customerToUpdate.setFirstName(customerDetails.getFirstName());
            }
            if (customerDetails.getLastName() != null && !customerDetails.getLastName().equals(customerToUpdate.getLastName())) {
                customerToUpdate.setLastName(customerDetails.getLastName());
            }
            if (customerDetails.getPhoneNumber() != null && !customerDetails.getPhoneNumber().equals(customerToUpdate.getPhoneNumber())) {
                customerToUpdate.setPhoneNumber(customerDetails.getPhoneNumber());
            } else if (customerDetails.getPhoneNumber() == null && customerToUpdate.getPhoneNumber() != null) {
                customerToUpdate.setPhoneNumber(null); // Erlaube das Löschen der Telefonnummer
            }
            return customerRepository.save(customerToUpdate);
        } else {
            return customerRepository.save(customerDetails);
        }
    }


    @Transactional
    public Customer updateCustomer(Long id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für diese ID :: " + id));

        customer.setFirstName(customerDetails.getFirstName());
        customer.setLastName(customerDetails.getLastName());
        customer.setEmail(customerDetails.getEmail()); // Vorsicht: E-Mail sollte eindeutig bleiben
        customer.setPhoneNumber(customerDetails.getPhoneNumber());

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für diese ID :: " + id));
        customerRepository.delete(customer);
    }

    public Optional<Customer> findCustomerByEmail(String email) {
        return customerRepository.findByEmail(email);
    }
}