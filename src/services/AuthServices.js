import api from "@/lib/api";

export const AuthService = {
    
    async login({email, password}) {
        const {data} = await api.post('/auth/login', {email, password})
        return data
    },

    async register({ email, password, name }){
        const { data } = await api.post('/auth/register', {email, password, name })
        return data
    },

    async logout(){
        await api.post('/auth/logout')
    },

    async getMe() {
    const { data } = await api.get('/users/me')
    return data.user
  },
}