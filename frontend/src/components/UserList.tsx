import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Badge,
  HStack,
  Text,
  Heading,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.request<{ users: User[] }>('/users');
      setUsers(response.users);
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await apiService.request(`/users/${userId}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      toast({
        title: 'User status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiService.request(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      toast({
        title: 'User role updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating user role',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>User Management</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Username</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Created At</Th>
            <Th>Last Login</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user._id}>
              <Td>{user.username}</Td>
              <Td>{user.email}</Td>
              <Td>
                <HStack spacing={2}>
                  <Badge colorScheme={user.role === 'admin' ? 'red' : 'blue'}>
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                  >
                    Toggle Role
                  </Button>
                </HStack>
              </Td>
              <Td>
                <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Td>
              <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
              <Td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme={user.isActive ? 'red' : 'green'}
                  onClick={() => handleToggleActive(user._id, user.isActive)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default UserList; 