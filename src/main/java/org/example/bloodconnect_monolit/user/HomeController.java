package org.example.bloodconnect_monolit;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/home")
    public RedirectView redirectToFrontend() {
        RedirectView redirectView = new RedirectView();
        redirectView.setUrl("http://localhost:5173");
        return redirectView;
    }

}