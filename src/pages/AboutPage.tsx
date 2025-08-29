import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Trophy, Users, MapPin, Target, Heart, Shield, Star } from "lucide-react";
export default function AboutPage() {
  const achievements = [{
    year: "1980",
    title: "Juara Perserikatan",
    description: "Mengalahkan Persipura Jayapura 3-1 di SUGBK, Jakarta",
    icon: Trophy
  }, {
    year: "2010/2011",
    title: "Runner-up Divisi Utama",
    description: "Promosi ke ISL setelah kalah tipis 1-0 dari Persiba Bantul",
    icon: Star
  }];
  const keyFacts = [{
    label: "Didirikan",
    value: "28 Juli 1957",
    icon: Calendar
  }, {
    label: "Julukan",
    value: "Laskar Rencong",
    icon: Shield
  }, {
    label: "Motto",
    value: "Lantak Laju (Hajar Terus)",
    icon: Target
  }, {
    label: "Stadion",
    value: "Stadion Harapan Bangsa",
    icon: MapPin
  }, {
    label: "Suporter",
    value: "SKULL (Suporter Kutaraja Untuk Lantak Laju)",
    icon: Users
  }];
  return <div className="min-h-screen bg-background pt-10 md:pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <img src="/icons/persiraja-logo.png" alt="Persiraja Logo" className="w-20 h-20  mx-auto mb-4" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Selamat Datang!</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Sejarah Persiraja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Persatuan Sepak bola Indonesia Kutaraja Banda Aceh</strong>, atau sering disingkat <strong className="text-primary">Persiraja Banda Aceh</strong> adalah sebuah klub sepak bola Indonesia asal Kota Banda Aceh, ibu kota Provinsi Aceh. Kutaraja merupakan nama lama Kota Banda Aceh. Klub ini didirikan pada tanggal <strong className="text-primary">28 Juli 1957</strong>.
                </p>
                <p>
                  Pada musim 2010/2011 Persiraja bermain di Divisi Utama Liga Indonesia sukses Promosi Ke Level Tertinggi Sepak Bola Indonesia. Karena Terjadinya Dualisme Kompetisi di Indonesia, Persiraja Banda Aceh Memutuskan Mengikuti Kompetisi Resmi dari PSSI yaitu Indonesian Premier League pada Musim 2011/2012.
                </p>
                <p>
                  Persiraja terkenal dengan permainan taktis terutama saat bermain di kandangnya yang terkenal angker bagi tim-tim lawan yang bermain di Banda Aceh.
                </p>
              </CardContent>
            </Card>

            {/* Suporter Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Suporter SKULL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Salah satu yang membuat Persiraja sulit dikalahkan di kandangnya sendiri, adalah dukungan luar biasa yang ditunjukkan oleh para penonton dan suporter mereka, yang dikenal dengan <strong className="text-primary">'Skuller'</strong> (julukan untuk anggota organisasi <strong>S.K.U.L.L</strong> alias <strong>Suporter Kutaraja Untuk Lantak Laju</strong>).
                </p>
                <p>
                  <strong className="text-primary">'Skuller'</strong> juga terkenal sebagai suporter yang sangat sportif dan selalu memberikan dukungan penuh kepada Laskar Rencong.
                </p>
              </CardContent>
            </Card>

            {/* Prestasi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Prestasi Terbaik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Prestasi terbaik yang dicapai Persiraja yakni tampil sebagai <strong className="text-primary">juara perserikatan pada tahun 1980</strong>. Di babak final yang berlangsung di Stadion Utama Gelora Bung Karno (SUGBK), Senayan, Jakarta, Persiraja sukses mengalahkan Persipura Jayapura dengan skor <strong className="text-primary">3-1</strong>.
                </p>
                <p>
                  Kala itu, 2 gol Persiraja berhasil disarangkan oleh <strong>Bustamam</strong> dan 1 gol lainnya dicetak oleh <strong>Rustam Syafari</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Era Modern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Persiraja berhasil mengangkat marwah persepak bolaan Aceh yang sebelumnya tenggelam akibat Konflik Aceh dengan menjadi <strong className="text-primary">juara 2 Divisi Utama Liga Indonesia</strong> musim 2010/2011 setelah kalah tipis dengan skor 1-0 di partai final oleh tim asal Yogyakarta, Persiba Bantul.
                </p>
                <p>
                  Dengan terbentuknya kepengurusan PSSI yang baru serta mewajibkan tim-tim sepak bola agar tidak menggunakan dana APBD di era industri sepak bola modern, maka pada bulan Agustus tahun 2011 Persiraja melakukan kerjasama merger bersama Aceh United untuk mengarungi kompetisi Indonesian Premier League musim 2011/2012.
                </p>
              </CardContent>
            </Card>

            {/* Visi Masa Depan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Visi dan Misi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Persebakbolaan di Banda Aceh menjadi hidup dengan kehadiran Persiraja Banda Aceh dan didukung oleh para tifosi penggemar sepak bola aceh yang terus bertambah.
                </p>
                <p>
                  Tanah rencong memiliki potensi besar karena tersedia bakat-bakat pemain muda dan suporter sepak bola yang aktif. Klub kebanggaan masyarakat aceh ini akan menampung bakat-bakat pemain muda lokal untuk berprestasi, dan menyuguhkan tontonan menghibur kepada para penonton juga suporter.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Key Facts */}
            <Card>
              <CardHeader>
                <CardTitle>Fakta Singkat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyFacts.map((fact, index) => {
                const Icon = fact.icon;
                return <div key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{fact.label}</p>
                        <p className="font-semibold">{fact.value}</p>
                      </div>
                    </div>;
              })}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Pencapaian Bersejarah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return <div key={index}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs mb-2">
                            {achievement.year}
                          </Badge>
                          <h4 className="font-semibold text-sm">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      {index < achievements.length - 1 && <Separator className="mt-4" />}
                    </div>;
              })}
              </CardContent>
            </Card>

            {/* Stadium Info */}
            <Card>
              <CardHeader>
                <CardTitle>Markas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold">Stadion Harapan Bangsa</h4>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>Jalan Sultan Malikul Saleh No.97</p>
                      <p>Lhoong Raya - Banda Aceh</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        
      </div>
    </div>;
}