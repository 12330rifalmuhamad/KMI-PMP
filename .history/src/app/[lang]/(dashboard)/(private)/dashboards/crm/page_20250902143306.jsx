// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
import CardStatVertical from '@/components/card-statistics/Vertical'
import BarChartRevenueGrowth from '@views/dashboards/crm/BarChartRevenueGrowth'
import EarningReportsWithTabs from '@views/dashboards/crm/EarningReportsWithTabs'
import RadarSalesChart from '@views/dashboards/crm/RadarSalesChart'
import SalesByCountries from '@views/dashboards/crm/SalesByCountries'
import ProjectStatus from '@views/dashboards/crm/ProjectStatus'
import ActiveProjects from '@views/dashboards/crm/ActiveProjects'
import LastTransaction from '@views/dashboards/crm/LastTransaction'
import ActivityTimeline from '@views/dashboards/crm/ActivityTimeline'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const DashboardCRM = async () => {
  // Vars
  const serverMode = await getServerMode()

  return (
    <Grid container spacing={6}>
      {/* Baris Pertama: Kartu Statistik Vertikal */}
      <Grid item xs={12} sm={6} md={3}>
        <CardStatVertical
          title='Sales'
          stats='245k'
          trend='positive'
          trendNumber='42%'
          avatarIcon='tabler-currency-dollar'
          avatarColor='primary'
          subtitle='Last Year'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatVertical
          title='Sessions'
          stats='12.5k'
          trend='negative'
          trendNumber='22%'
          avatarIcon='tabler-chart-bar'
          avatarColor='success'
          subtitle='Last 6 Months'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatVertical
          title='Customers'
          stats='1.54k'
          trend='positive'
          trendNumber='15%'
          avatarIcon='tabler-users'
          avatarColor='warning'
          subtitle='Last Quarter'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <CardStatVertical
          title='Orders'
          stats='48.2k'
          trend='positive'
          trendNumber='25%'
          avatarIcon='tabler-shopping-cart'
          avatarColor='info'
          subtitle='Last Month'
        />
      </Grid>

      {/* Baris Kedua: Grafik Utama */}
      <Grid item xs={12} md={8}>
        <LineAreaYearlySalesChart serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={4}>
        <BarChartRevenueGrowth serverMode={serverMode} />
      </Grid>

      {/* Baris Ketiga: Laporan & Penjualan per Negara */}
      <Grid item xs={12} md={8}>
        <EarningReportsWithTabs serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={4}>
        <SalesByCountries />
      </Grid>

      {/* Baris Keempat: Status & Proyek Aktif */}
      <Grid item xs={12} md={4}>
        <ProjectStatus serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={8}>
        <ActiveProjects />
      </Grid>

      {/* Baris Kelima: Transaksi & Timeline Aktivitas */}
      <Grid item xs={12} md={8}>
        <LastTransaction />
      </Grid>
      <Grid item xs={12} md={4}>
        <ActivityTimeline />
      </Grid>

      {/* Baris Keenam: Grafik Tambahan */}
      <Grid item xs={12} md={6}>
        <DistributedBarChartOrder serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={6}>
        <RadarSalesChart serverMode={serverMode} />
      </Grid>
    </Grid>
  )
}

export default DashboardCRM
