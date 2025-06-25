import React from "react";
import {
    Box,
    Typography,
    Grid,
    Avatar,
    Card,
    CardContent,
    Divider,
    Chip
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";

const ProofDeliveryLiveLoc: React.FC = () => {
    return (
        <Box p={3}>
            {/* Header */}
            <Typography variant="subtitle2" color="text.secondary" mb={2} >
                PLZ 81-82-86-87 BRANKO MITTWOCH 04.06.2025 (Tag 1 von 2)
            </Typography>

            {/* Proof Card */}
            <Card style={{marginRight:'100px',marginLeft:'100px'}}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                Nachweis
                            </Typography>
                            <Typography fontWeight="bold">SUNNIVA GmbH</Typography>
                            <Typography>Honer Straße 49</Typography>
                            <Typography>37269 Eschwege</Typography>
                        </Box>
                        <Box>
                            <Box
                                component="img"
                                src="/sunnivaLogo.png"
                                alt="SUNNIVA Logo"
                                sx={{ width: 220 }}
                            />
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1}>
                        {/* Status */}
                        <Grid item xs={4} md={3}>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                        </Grid>
                        <Grid item xs={8} md={9}>
                            <Chip
                                icon={<CheckCircleIcon color="success" />}
                                label="Erfolg"
                                color="success"
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Referenz */}
                        <Grid item xs={4} md={3}>
                            <Typography variant="body2" color="text.secondary">Referenz</Typography>
                        </Grid>
                        <Grid item xs={8} md={9}>
                            <Typography>400242939</Typography>
                        </Grid>

                        {/* Name */}
                        <Grid item xs={4} md={3}>
                            <Typography variant="body2" color="text.secondary">Name</Typography>
                        </Grid>
                        <Grid item xs={8} md={9}>
                            <Typography>Johannes Pöckl</Typography>
                        </Grid>

                        {/* Datum */}
                        <Grid item xs={4} md={3}>
                            <Typography variant="body2" color="text.secondary">Datum</Typography>
                        </Grid>
                        <Grid item xs={8} md={9}>
                            <Typography>04.06.2025 @ 10:32:03</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Grid container spacing={1}>
                            {/* Adresse */}
                            <Grid item xs={4} md={3}>
                                <Typography variant="body2" color="text.secondary">Adresse</Typography>
                            </Grid>
                            <Grid item xs={8} md={9}>
                                <Typography>Berg-am-Laim-Straße 82, 81673 München</Typography>
                            </Grid>

                            {/* Notiz */}
                            <Grid item xs={4} md={3}>
                                <Typography variant="body2" color="text.secondary">Notiz</Typography>
                            </Grid>
                            <Grid item xs={8} md={9}>
                                <Typography>-</Typography>
                            </Grid>

                            {/* Mitarbeiter */}
                            <Grid item xs={4} md={3}>
                                <Typography variant="body2" color="text.secondary">Mitarbeiter</Typography>
                            </Grid>
                            <Grid item xs={8} md={9}>
                                <Chip
                                    icon={<PersonIcon />}
                                    label="Branko Tomic"
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProofDeliveryLiveLoc;
