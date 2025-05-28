package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Autowired
    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
// Hier könnten Validierungen oder zusätzliche Logik stehen, bevor gespeichert wird
        return customerRepository.save(customer);
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
                customerToUpdate.setPhoneNumber(null);
            }
// Notizen werden hier bewusst nicht aktualisiert, da findOrCreateCustomer eher beim Terminbuchen verwendet wird.
// Die Admin-Notizen sollten separat über die Kundenverwaltung (updateCustomer) geändert werden.
            return customerRepository.save(customerToUpdate);
        } else {
// Beim Erstellen eines neuen Kunden durch Terminbuchung sollten Admin-Notizen leer sein.
            customerDetails.setNotes(null); // Oder einen leeren String, je nach Präferenz
            return customerRepository.save(customerDetails);
        }
    }

    @Transactional
    public Customer updateCustomer(Long id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für diese ID :: " + id));

        customer.setFirstName(customerDetails.getFirstName());
        customer.setLastName(customerDetails.getLastName());
        customer.setEmail(customerDetails.getEmail()); // Vorsicht: E-Mail sollte eindeutig bleiben, ggf. separate Prüfung
        customer.setPhoneNumber(customerDetails.getPhoneNumber());
        customer.setNotes(customerDetails.getNotes()); // NEUES FELD aktualisieren

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für diese ID :: " + id));
// Hier ggf. prüfen, ob der Kunde noch Termine hat, bevor er gelöscht wird,
// oder Termine mitlöschen/anonymisieren (DSGVO). Fürs Erste löschen wir direkt.
        customerRepository.delete(customer);
    }

    public Optional<Customer> findCustomerByEmail(String email) {
        return customerRepository.findByEmail(email);
    }


}
