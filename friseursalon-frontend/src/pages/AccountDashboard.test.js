import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountDashboard from './AccountDashboard';
import api from '../services/api.service';
import authService from '../services/auth.service';

// Mock services
jest.mock('../services/api.service');
jest.mock('../services/auth.service');

const mockCurrentUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890',
    roles: ['ROLE_USER'],
    token: 'fake-token'
};

const mockAdminUser = {
    ...mockCurrentUser,
    roles: ['ROLE_ADMIN', 'ROLE_USER'],
};

const mockLogOut = jest.fn();

// Helper function to render with default props
const renderDashboard = (currentUser = mockCurrentUser) => {
    return render(
        <AccountDashboard
            currentUser={currentUser}
            logOut={mockLogOut}
            onAppointmentAdded={jest.fn()}
            refreshAppointmentsList={0}
            onServiceAdded={jest.fn()}
            refreshServicesList={0}
        />
    );
};

describe('AccountDashboard Profile Section', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Mock authService.getCurrentUser to return the initial user for UI updates
        authService.getCurrentUser.mockReturnValue(mockCurrentUser); 
    });

    test('displays user profile information', () => {
        renderDashboard();
        
        // Navigate to "Meine Daten" tab if not default
        fireEvent.click(screen.getByRole('button', { name: /meine daten/i }));

        expect(screen.getByText(mockCurrentUser.firstName)).toBeInTheDocument();
        expect(screen.getByText(mockCurrentUser.lastName)).toBeInTheDocument();
        expect(screen.getByText(mockCurrentUser.email)).toBeInTheDocument();
        expect(screen.getByText(mockCurrentUser.phoneNumber)).toBeInTheDocument();
    });

    test('toggles edit mode and displays form with pre-filled data', async () => {
        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: /meine daten/i }));
        fireEvent.click(screen.getByRole('button', { name: /bearbeiten/i }));

        await waitFor(() => {
            expect(screen.getByLabelText(/vorname/i)).toHaveValue(mockCurrentUser.firstName);
            expect(screen.getByLabelText(/nachname/i)).toHaveValue(mockCurrentUser.lastName);
            expect(screen.getByLabelText(/telefonnummer/i)).toHaveValue(mockCurrentUser.phoneNumber);
        });
        expect(screen.getByRole('button', { name: /speichern/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument();
    });

    test('updates profile successfully', async () => {
        const updatedUser = {
            ...mockCurrentUser,
            firstName: 'UpdatedFirst',
            lastName: 'UpdatedLast',
            phoneNumber: '0000000000'
        };
        api.updateUserProfile.mockResolvedValue(updatedUser); // Backend returns updated user (without token typically)
        
        // When authService.getCurrentUser() is called after update, it should reflect the change.
        // api.service.js already updates localStorage, so this mock simulates that.
        authService.getCurrentUser.mockImplementation(() => {
            // This will be called by handleProfileUpdate to refresh internalCurrentUser
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser && storedUser.firstName === "UpdatedFirst") { // Check if update happened
                return storedUser;
            }
            return mockCurrentUser; // Return old one if not updated yet
        });


        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: /meine daten/i }));
        fireEvent.click(screen.getByRole('button', { name: /bearbeiten/i }));

        fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'UpdatedFirst' } });
        fireEvent.change(screen.getByLabelText(/nachname/i), { target: { value: 'UpdatedLast' } });
        fireEvent.change(screen.getByLabelText(/telefonnummer/i), { target: { value: '0000000000' } });
        
        fireEvent.click(screen.getByRole('button', { name: /speichern/i }));

        await waitFor(() => {
            expect(api.updateUserProfile).toHaveBeenCalledWith({
                firstName: 'UpdatedFirst',
                lastName: 'UpdatedLast',
                phoneNumber: '0000000000'
            });
        });
        
        await waitFor(() => {
            expect(screen.getByText(/profil erfolgreich aktualisiert!/i)).toBeInTheDocument();
        });

        // Form should be hidden, back to view mode
        expect(screen.queryByRole('button', { name: /speichern/i })).not.toBeInTheDocument();
        
        // Displayed info should be updated
        // Need to ensure the component re-renders with updated internalCurrentUser
        await waitFor(() => {
            expect(screen.getByText('UpdatedFirst')).toBeInTheDocument();
            expect(screen.getByText('UpdatedLast')).toBeInTheDocument();
            expect(screen.getByText('0000000000')).toBeInTheDocument();
        });
    });


    test('handles API error during profile update', async () => {
        api.updateUserProfile.mockRejectedValue({
            response: { data: { message: 'Update failed!' } }
        });

        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: /meine daten/i }));
        fireEvent.click(screen.getByRole('button', { name: /bearbeiten/i }));

        fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'NewName' } });
        fireEvent.click(screen.getByRole('button', { name: /speichern/i }));

        await waitFor(() => {
            expect(screen.getByText(/update failed!/i)).toBeInTheDocument();
        });
        // Should remain in edit mode
        expect(screen.getByRole('button', { name: /speichern/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/vorname/i)).toHaveValue('NewName');
    });

    test('cancels editing and discards changes', async () => {
        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: /meine daten/i }));
        fireEvent.click(screen.getByRole('button', { name: /bearbeiten/i }));

        fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'TemporaryValue' } });
        expect(screen.getByLabelText(/vorname/i)).toHaveValue('TemporaryValue');
        
        fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));

        await waitFor(() => {
            // Back to view mode
            expect(screen.queryByRole('button', { name: /speichern/i })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: /bearbeiten/i })).toBeInTheDocument();
        });

        // Data should be reverted to original
        expect(screen.getByText(mockCurrentUser.firstName)).toBeInTheDocument();
        expect(screen.queryByText('TemporaryValue')).not.toBeInTheDocument();
    });
});

// You can add more describe blocks for other parts of AccountDashboard if needed,
// e.g., for admin functionalities, appointment list rendering, etc.
// For now, focusing on the profile update part.
