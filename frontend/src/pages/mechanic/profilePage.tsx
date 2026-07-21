import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PenTool as Tool, User, Mail, Calendar, Phone, MapPin, DollarSign, Briefcase, Clock, ChartNoAxesColumn } from 'lucide-react';
import { toast } from 'react-toastify';
import { selectEmployeeAuthData } from '../../store/selectors';
import { EmployeeAPI } from '../../api/employee/employee';

const indianPhoneRegex = /^[6-9]\d{9}$/;

const MechanicProfile = () => {
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    contactNumber: '',
    address: '',
    age: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!employeeData?.id) return;

      try {
        setLoading(true);
        const data = await EmployeeAPI.getEmployeeProfile(employeeData.id);
        setProfileData(data);
        setFormData({
          employeeName: data.employeeName,
          contactNumber: data.contactNumber,
          address: data.address,
          age: data.age
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [employeeData?.id]);

  useEffect(() => {
  const newErrors: { [key: string]: string } = {};

  if (!(formData.employeeName?.trim())) {
    newErrors.employeeName = 'Name is required';
  }

  if (!(formData.contactNumber?.trim())) {
    newErrors.contactNumber = 'Contact number is required';
  } else if (!indianPhoneRegex.test(formData.contactNumber.trim())) {
    newErrors.contactNumber = 'Invalid Indian phone number, must be 10 digits starting with 6-9';
  }

  if (!(formData.address?.trim())) {
    newErrors.address = 'Address is required';
  }

  if (formData.age === undefined || formData.age === null || formData.age.toString().trim() === '') {
    newErrors.age = 'Age is required';
  } else if (isNaN(Number(formData.age)) || Number(formData.age) < 18) {
    newErrors.age = 'Enter a valid age (18 or older)';
  }

  setErrors(newErrors);
}, [formData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (Object.keys(errors).length > 0) {
    toast.error('Please fix validation errors before saving.');
    return;
  }
  if (!employeeData?.id) return;

  try {
    const updatedEmployee = await EmployeeAPI.updateEmployeeProfile(
      employeeData.id,
      {
        employeeName: formData.employeeName.trim(),
        contactNumber: formData.contactNumber.trim(),
        address: formData.address.trim(),
        age: Number(formData.age)
      }
    );

    setProfileData((prev:any) => ({
      ...prev,
      ...updatedEmployee
    }));

    setFormData({
      employeeName: updatedEmployee.employeeName ?? formData.employeeName,
      contactNumber: updatedEmployee.contactNumber ?? formData.contactNumber,
      address: updatedEmployee.address ?? formData.address,
      age: updatedEmployee.age !== undefined ? updatedEmployee.age.toString() : formData.age
    });

    toast.success('Profile updated successfully');
    setEditMode(false);
  } catch (error) {
    toast.error('Failed to update profile');
    console.error(error);
  }
};


  if (loading) {
    return <div className="p-6">Loading profile data...</div>;
  }

  if (!profileData) {
    return <div className="p-6">No profile data available</div>;
  }
  console.log(profileData, "12341234")
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profileData.employeeName}</h1>
                <p className="text-blue-200 capitalize">{profileData.position}</p>
              </div>
            </div>
            {!editMode && (
              <button 
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              >
                <Tool size={16} className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editMode ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${errors.employeeName ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.employeeName && <p className="text-red-600 text-xs mt-1">{errors.employeeName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.contactNumber && <p className="text-red-600 text-xs mt-1">{errors.contactNumber}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.age && <p className="text-red-600 text-xs mt-1">{errors.age}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h2>
                 <div className="flex items-start space-x-3">
                  <User size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-gray-800">{profileData.employeeName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800">{profileData.emailId}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="text-gray-800">{profileData.contactNumber}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-800">{profileData.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-gray-800">{profileData.age}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Professional Information</h2>

                <div className="flex items-start space-x-3">
                  <Calendar size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="text-gray-800">{new Date(profileData.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Current Salary</p>
                    <p className="text-gray-800">{profileData.currentSalary}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Briefcase size={20} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="text-gray-800 capitalize">{profileData.position}</p>
                  </div>
                </div>

                {profileData.fieldOfMechanic && (
                  <div className="flex items-start space-x-3">
                    <Tool size={20} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Specialization</p>
                      <p className="text-gray-800 capitalize">{profileData.fieldOfMechanic.map((pre : any) => pre)}</p>
                    </div>
                  </div>
                )}

                {profileData.experience && (
                  <div className="flex items-start space-x-3">
                    <Clock size={20} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="text-gray-800">{profileData.experience} years</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MechanicProfile;
