import { HttpInterceptorFn } from '@angular/common/http';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
    console.log("interceptor", req.url)
    // Solo agregar token si es una petición a la API y el usuario es admin
    if (req.url.includes('/api/')) {
        const adminToken = localStorage.getItem('admin_token');

        console.log("agregare token", adminToken)
        if (adminToken) {
            // Clonar la petición y agregar el header de autorización
            const clonedReq = req.clone({
                setHeaders: {
                    Authorization: adminToken
                }
            });
            console.log("token agregado", clonedReq)
            return next(clonedReq);
        }
    }

    return next(req);
};
