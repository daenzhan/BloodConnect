package org.example.bloodconnect_monolit;

import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import lombok.Data;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class HomeController {

    @GetMapping("/home")
    public RedirectView redirectToFrontend() {
        RedirectView redirectView = new RedirectView();
        redirectView.setUrl("http://localhost:3000/home");
        redirectView.setStatusCode(HttpStatus.PERMANENT_REDIRECT); // 308
        return redirectView;
    }

    @GetMapping("/")
    public RedirectView redirectRoot() {
        RedirectView redirectView = new RedirectView();
        redirectView.setUrl("http://localhost:3000/home");
        return redirectView;
    }

}