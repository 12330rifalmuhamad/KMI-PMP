// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import StatisticsCard from '@/views/pagesll/widget-examples/statistics/StatisticsCard'
import Square from '@/views/pagesll/widget-examples/statistics/Square'
import DistributedBarChartOrder from '@/views/pagesll/widget-examples/statistics/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@/views/pagesll/widget-examples/statistics/LineAreaYearlySalesChart'
import LineChartProfit from '@/views/pagesll/widget-examples/statistics/LineChartProfit'
import BarChartSessionsWithNegativeValues from '@/views/pagesll/widget-examples/statistics/BarChartSessionsWithNegativeValues'
import RadialBarChart from '@/views/pagesll/widget-examples/statistics/RadialBarChart'
import LineChartImpression from '@/views/pagesll/widget-examples/statistics/LineChartImpression'
import Horizontal from '@/views/pagesll/widget-examples/statistics/Horizontal'
import CardStatsLineAreaCharts from '@/views/pagesll/widget-examples/statistics/CardStatsLineAreaCharts'
import LineAreaDailySalesChart from '@/views/pagesll/widget-examples/statistics/LineAreaDailySalesChart'
import SalesOverview from '@/views/pagesll/widget-examples/statistics/SalesOverview'
import BarChartDailyTraffic from '@/views/pagesll/widget-examples/statistics/BarChartDailyTraffic'
import SubscribersOrders from '@/views/pagesll/widget-examples/statistics/SubscribersOrders'
import Vertical from '@/views/pagesll/widget-examples/statistics/Vertical'
import BarChartRevenueGrowth from '@/views/pagesll/widget-examples/statistics/BarChartRevenueGrowth'
import DonutChartGeneratedLeads from '@/views/pagesll/widget-examples/statistics/DonutChartGeneratedLeads'
import HorizontalStatisticsCard from '@/views/pagesll/widget-examples/statistics/HorizontalStatisticsCard'
import CustomerStatisticsCard from '@/views/pagesll/widget-examples/statistics/CustomerStatisticsCard'
import LogisticsStatisticsCard from '@views/apps/logistics/dashboard/LogisticsStatisticsCard'
import UserListCards from '@/views/pagesll/widget-examples/statistics/UserListCards'

// Data Imports
import { getStatisticsData } from '@/app/server/actions'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/pages/widget-examples` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getStatisticsData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/pages/widget-examples`)

  if (!res.ok) {
    throw new Error('Failed to fetch statistics data')
  }

  return res.json()
} */
const Statistics = async () => {
  // Vars
  const statsData = await getStatisticsData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 8 }}>
        <StatisticsCard />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Square data={statsData.statsSquare} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <DistributedBarChartOrder />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <LineAreaYearlySalesChart />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <LineChartProfit />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <BarChartSessionsWithNegativeValues />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <RadialBarChart />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <LineChartImpression />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LogisticsStatisticsCard data={statsData?.statsHorizontalWithBorder} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListCards />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Horizontal data={statsData.statsHorizontal} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CardStatsLineAreaCharts data={statsData.statsWithAreaChart} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <LineAreaDailySalesChart />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SalesOverview />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <BarChartDailyTraffic />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SubscribersOrders />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <HorizontalStatisticsCard data={statsData?.statsHorizontalWithAvatar} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomerStatisticsCard customerStatData={statsData?.customerStats} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Vertical data={statsData.statsVertical} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <BarChartRevenueGrowth />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <DonutChartGeneratedLeads />
      </Grid>
    </Grid>
  )
}

export default Statistics
