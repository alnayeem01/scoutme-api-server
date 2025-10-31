import * as yup from 'yup'

export const registerUserSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup.string().optional(),
    photoUrl: yup.string().optional(),
    fireabseUID: yup.string().required('FirebaseUID is required!')
})